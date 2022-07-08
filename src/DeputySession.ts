import DeputyCasePage, { ContributionSurveyHeading } from './wiki/DeputyCasePage';
import sectionHeadingName from './util/sectionHeadingName';
import DeputyContributionSurveySection from './ui/DeputyContributionSurveySection';
import DeputyCCISessionStartLink from './ui/DeputyCCISessionStartLink';
import unwrapWidget from './util/unwrapWidget';
import DeputyCCISessionContinueMessage from './ui/DeputyCCISessionContinueMessage';
import swapElements from './util/swapElements';
import removeElement from './util/removeElement';
import DeputyCCISessionAddSection from './ui/DeputyCCISessionAddSection';
import DeputyCCISessionTabActiveMessage from './ui/DeputyCCISessionTabActiveMessage';
import {
	DeputyMessageEvent,
	DeputySessionRequestMessage
} from './DeputyCommunications';

interface SessionInformation {
	/**
	 * A specific case page, refers to a case in the {@link DeputyCasePageCacheStore}.
	 */
	casePageId: number;
	/**
	 * The sections which were last left open.
	 */
	caseSections: string[];
}

/**
 * Handles the active Deputy session and sets up inter-tab communication.
 *
 * A "Session" is a period wherein Deputy exercises a majority of its features,
 * namely the use of inter-tab communication and database transactions for
 * page and revision caching. Other tabs that load Deputy will recognize the
 * started session and begin communicating with the root tab (the tab with the
 * CCI page, and therefore the main Deputy session handler, open).
 */
export default class DeputySession {

	/**
	 * The current active session, if one exists.
	 */
	session: SessionInformation;
	/**
	 * A DiscussionTools Parser. Used for parsing comments in a streamlined way (using
	 * DiscussionTools) as compared to relying on an in-house parser.
	 */
	parser: any;
	/**
	 * An array of active section UI elements. Populated in `initSessionInterface`.
	 */
	sections: DeputyContributionSurveySection[];

	/**
	 * Responder for session requests.
	 */
	readonly sessionRequestResponder = this.sendSessionResponse.bind( this );

	/**
	 * Initialize session-related information. If an active session was detected,
	 * restart it.
	 */
	async init() {
		// Check if there is an active session.
		this.session = await this.getSession();

		if ( this.session ) {
			if ( this.session.caseSections.length === 0 ) {
				// No more sections. Discard session.
				await this.setSession( null );
				await this.init();
			} else if ( this.session.casePageId === window.deputy.currentPageId ) {
				// Definitely a case page, no need to question.
				const casePage = await DeputyCasePage.build();

				if ( mw.config.get( 'wgAction' ) !== 'view' ) {
					// This page's main content is not being viewed. Do nothing.
				} else if (
					mw.config.get( 'wgRevisionId' ) !==
					mw.config.get( 'wgCurRevisionId' )
				) {
					// This is not the latest version of the page. Do nothing.
				} else if ( await this.checkForActiveSessionTabs() ) {
					// Session is active in another tab. Defer to other tab.
					await this.initTabActiveInterface( casePage );
				} else {
					// Page reloaded or exited without proper session close.
					// Continue where we left off.
					await this.initSessionInterface( casePage );
					await casePage.bumpActive();
				}
			} else if ( DeputyCasePage.isCasePage() ) {
				// TODO: Show "start work" with session replacement warning
			}
		} else {
			// No active session
			if ( DeputyCasePage.isCasePage() ) {
				const casePage = await DeputyCasePage.build();

				if ( await casePage.isCached() ) {
					await this.initContinueInterface( casePage );
				} else {
					// Show session start buttons
					await this.initEntryInterface();
				}
			}
		}
	}

	/**
	 * Broadcasts a `sessionRequest` message to the Deputy communicator to find other
	 * tabs with open sessions. This prevents two tabs from opening the same session
	 * at the same time.
	 */
	async checkForActiveSessionTabs(): Promise<boolean> {
		return await window.deputy.comms.sendAndWait( { type: 'sessionRequest' } )
			.then( ( res ) => {
				return res != null;
			} );
	}

	/**
	 * Initialize interface components for *starting* a session. This includes
	 * the `[start CCI session]` notice at the top of each CCI page section heading.
	 *
	 * @param _casePage
	 */
	async initEntryInterface( _casePage?: DeputyCasePage ): Promise<void> {
		const continuing = _casePage != null;
		const casePage = continuing ? _casePage : await DeputyCasePage.build();

		casePage.findContributionSurveyHeadings()
			.forEach( ( heading: ContributionSurveyHeading ) => {
				heading.appendChild(
					DeputyCCISessionStartLink( heading, this, casePage )
				);
			} );
	}

	/**
	 * Shows the interface for continuing a previous session. This includes
	 * the `[continue CCI session]` notice at the top of each CCI page section heading
	 * and a single message box showing when the page was last worked on on top of the
	 * first CCI heading found.
	 *
	 * @param casePage
	 */
	async initContinueInterface(
		casePage: DeputyCasePage
	): Promise<void> {
		await Promise.all( [
			this.initEntryInterface( casePage ),
			mw.loader.using(
				[ 'oojs-ui-core', 'oojs-ui.styles.icons-content' ],
				() => {
					const firstHeading = casePage.findContributionSurveyHeadings()[ 0 ];
					if ( firstHeading ) {
						// Insert element directly into widget (not as text, or else event
						// handlers will be destroyed).
						const messageBox = new OO.ui.MessageWidget( {
							classes: [
								'deputy', 'dp-cs-session-notice', 'dp-cs-session-lastActive'
							],
							type: 'notice',
							icon: 'history',
							label: new OO.ui.HtmlSnippet(
								DeputyCCISessionContinueMessage( { casePage } ).innerHTML
							)
						} );

						const continueButton = new OO.ui.ButtonWidget( {
							classes: [ 'dp-cs-session-continue' ],
							label: mw.message( 'deputy.session.continue.button' ).text(),
							flags: [ 'primary', 'progressive' ]
						} );
						const sessionStartListener = async () => {
							removeElement( unwrapWidget( messageBox ) );
							await this.initTabActiveInterface( casePage );
						};
						continueButton.on( 'click', () => {
							window.deputy.session.continueSession( casePage );
							window.deputy.comms.removeEventListener(
								'sessionStarted',
								sessionStartListener
							);
						} );
						swapElements(
							unwrapWidget( messageBox )
								.querySelector( '.dp-cs-session-continue' ),
							unwrapWidget( continueButton )
						);

						firstHeading.insertAdjacentElement(
							'beforebegin',
							unwrapWidget( messageBox )
						);

						window.deputy.comms.addEventListener(
							'sessionStarted',
							sessionStartListener,
							{ once: true }
						);
					}
				}
			)
		] );
	}

	/**
	 * Shows the interface for an attempted Deputy execution on a different tab than
	 * expected. This prevents Deputy from running entirely to avoid loss of progress
	 * and desynchronization.
	 *
	 * @param casePage The CURRENT case page.
	 */
	async initTabActiveInterface(
		casePage: DeputyCasePage
	): Promise<void> {
		return mw.loader.using(
			[ 'oojs-ui-core', 'oojs-ui.styles.icons-content' ],
			() => {
				const firstHeading = casePage.findContributionSurveyHeadings()[ 0 ];
				if ( firstHeading ) {
					const messageBox = new OO.ui.MessageWidget( {
						classes: [
							'deputy', 'dp-cs-session-notice', 'dp-cs-session-tabActive'
						],
						type: 'info',
						label: new OO.ui.HtmlSnippet(
							DeputyCCISessionTabActiveMessage().innerHTML
						)
					} );
					firstHeading.insertAdjacentElement(
						'beforebegin',
						unwrapWidget( messageBox )
					);

					window.deputy.comms.addEventListener(
						'sessionClosed',
						async () => {
							removeElement( unwrapWidget( messageBox ) );
							await this.init();
						},
						{ once: true }
					);
				}
			}
		);
	}

	/**
	 * Initialize interface components for an active session. This will always run in the
	 * context of a CCI case page.
	 *
	 * @param casePage
	 */
	async initSessionInterface(
		casePage: DeputyCasePage
	): Promise<void> {
		if ( window.location.search.indexOf( 'action=edit' ) !== -1 ) {
			// User is editing, don't load interface.
			return;
		}
		if ( await this.checkForActiveSessionTabs() ) {
			// User is on another tab, don't load interface.
			mw.loader.using( [ 'oojs-ui-core', 'oojs-ui-windows' ], () => {
				OO.ui.alert(
					mw.message( 'deputy.session.tabActive.help' ).text(),
					{ title: mw.message( 'deputy.session.tabActive.head' ).text() }
				);
			} );
			return;
		}

		removeElement( casePage.document.querySelector( '.dp-cs-session-lastActive' ) );
		casePage.document.querySelectorAll( '.dp-sessionStarter' )
			.forEach( ( el: HTMLElement ) => {
				removeElement( el );
			} );

		window.deputy.comms.addEventListener( 'sessionRequest', this.sessionRequestResponder );
		window.deputy.comms.send( { type: 'sessionStarted', caseId: this.session.casePageId } );

		await new Promise<void>( ( res ) => {
			mw.loader.using( [
				'mediawiki.special.changeslist',
				'mediawiki.interface.helpers.styles',
				'mediawiki.pager.styles',
				'oojs-ui-core',
				'oojs-ui-windows',
				'oojs-ui.styles.icons-alerts',
				'oojs-ui.styles.icons-content',
				'oojs-ui.styles.icons-editing-core',
				'oojs-ui.styles.icons-interactions',
				'oojs-ui.styles.icons-media',
				'oojs-ui.styles.icons-movement',
				'ext.discussionTools.init'
			], async ( require ) => {
				// Instantiate the parser
				const dt = require( 'ext.discussionTools.init' );
				this.parser = new dt.Parser( dt.parserData );

				window.deputy.windowManager = new OO.ui.WindowManager();
				document.getElementsByTagName( 'body' )[ 0 ]
					.appendChild( window.deputy.windowManager.$element[ 0 ] );

				// TODO: Do interface functions
				this.sections = [];

				const foundSections: string[] = [];
				for ( const heading of casePage.findContributionSurveyHeadings() ) {
					const headingName = sectionHeadingName( heading );

					if ( this.session.caseSections.indexOf( headingName ) !== -1 ) {
						foundSections.push( headingName );
						( () => {
							// Placed in self-executing function for asynchronicity.
							this.activateSection( casePage, heading );
						} )();
					} else {
						this.addSectionOverlay( casePage, heading );
					}
				}

				// Strip missing sections from caseSections.
				this.session.caseSections = foundSections;
				await this.setSession( this.session );

				res();
			} );
		} );
	}

	/**
	 * Responds to session requests through the Deputy communicator. This prevents two
	 * tabs from having the same session opened.
	 *
	 * @param event
	 */
	sendSessionResponse(
		event: DeputyMessageEvent<DeputySessionRequestMessage>
	): void {
		window.deputy.comms.reply(
			event.data, {
				type: 'sessionResponse',
				caseId: this.session.casePageId,
				sections: this.session.caseSections
			}
		);
	}

	/**
	 * Adds the "start working on this section" or "reload page" overlay and button
	 * to a given section.
	 *
	 * @param casePage
	 * @param heading
	 */
	addSectionOverlay( casePage: DeputyCasePage, heading: ContributionSurveyHeading ): void {
		const section = casePage.getContributionSurveySection( heading );
		const list = section.find( ( v ) => v.tagName === 'UL' );

		if ( list != null ) {
			list.style.position = 'relative';
			list.appendChild( DeputyCCISessionAddSection( {
				casePage, heading
			} ) );
		}
	}

	/**
	 * Gets the current active session information.
	 *
	 * @return {Promise<SessionInformation|undefined>}
	 *     A promise that resolves with the session information or `undefined` if session
	 *     information is not available.
	 */
	async getSession(): Promise<SessionInformation | undefined> {
		return ( await window.deputy.storage.getKV( 'session' ) ) as SessionInformation | undefined;
	}

	/**
	 * Sets the current active session information.
	 *
	 * @param session The session to save.
	 * @return boolean `true` if successful.
	 */
	setSession( session: SessionInformation ): Promise<boolean> {
		this.session = session;
		return window.deputy.storage.setKV( 'session', session );
	}

	/**
	 * Starts a Deputy session.
	 *
	 * @param section
	 */
	async startSession( section: ContributionSurveyHeading ): Promise<void> {
		const pageID = window.deputy.currentPageId;
		const sectionName = sectionHeadingName( section );

		// Save session to storage
		const casePage = await DeputyCasePage.build();
		await this.setSession( {
			casePageId: pageID,
			caseSections: [ sectionName ]
		} );

		await this.initSessionInterface( casePage );
		await casePage.bumpActive();
	}

	/**
	 * Continue a session from a DeputyCasePage.
	 *
	 * @param casePage
	 */
	async continueSession( casePage: DeputyCasePage ): Promise<void> {
		const pageID = window.deputy.currentPageId;

		// Save session to storage
		await this.setSession( {
			casePageId: pageID,
			// Shallow array copy
			caseSections: [ ...casePage.lastActiveSections ]
		} );

		await this.initSessionInterface( casePage );
		await casePage.bumpActive();
	}

	/**
	 * Closes the current session.
	 *
	 * @param casePage
	 */
	async closeSession( casePage: DeputyCasePage ): Promise<void> {
		if ( this.sections ) {
			for ( const section of this.sections ) {
				section.close();
			}
		}

		casePage.document.querySelectorAll( '.dp-cs-section-add' )
			.forEach( ( el: HTMLElement ) => removeElement( el ) );

		await casePage.saveToCache();
		const oldSession = this.session;
		window.deputy.comms.removeEventListener(
			'sessionRequest', this.sessionRequestResponder
		);
		await this.setSession( null );
		window.deputy.comms.send( { type: 'sessionClosed', caseId: oldSession.casePageId } );
	}

	/**
	 * Activates a section. This appends the section UI, adds the section to the
	 * cache (if not already added), and internally stores the section for a
	 * graceful exit.
	 *
	 * @param casePage
	 * @param heading
	 */
	async activateSection(
		casePage: DeputyCasePage,
		heading: ContributionSurveyHeading
	): Promise<void> {
		const el = new DeputyContributionSurveySection( casePage, heading );
		await el.prepare();

		const sectionName = sectionHeadingName( heading );
		this.sections.push( el );
		const lastActiveSession = this.session.caseSections.indexOf( sectionName );
		if ( lastActiveSession === -1 ) {
			this.session.caseSections.push( sectionName );
			await this.setSession( this.session );
		}
		await casePage.addActiveSection( sectionName );

		heading.insertAdjacentElement( 'afterend', el.render() );
	}

	/**
	 * Closes a section. This removes the section from both the session data and from
	 * the case page cache.
	 */
	async closeSection( e0: DeputyCasePage, e1: ContributionSurveyHeading ): Promise<void>;
	/**
	 * Closes a section. This removes the section from both the session data and from
	 * the case page cache.
	 */
	async closeSection( e0: DeputyContributionSurveySection ): Promise<void>;
	/**
	 * Closes a section. This removes the section from both the session data and from
	 * the case page cache.
	 *
	 * @param e0
	 * @param e1
	 */
	async closeSection(
		e0: DeputyContributionSurveySection | DeputyCasePage,
		e1?: ContributionSurveyHeading,
	): Promise<void> {
		const el = e0 instanceof DeputyContributionSurveySection ?
			e0 : null;
		const casePage = e0 instanceof DeputyContributionSurveySection ?
			e0.casePage : e0;
		const heading = e0 instanceof DeputyContributionSurveySection ?
			e0.heading : e1;

		const sectionName = sectionHeadingName( heading );
		const sectionListIndex = this.sections.indexOf( el );
		if ( el != null && sectionListIndex !== -1 ) {
			this.sections.splice( sectionListIndex, 1 );
		}
		const lastActiveSession = this.session.caseSections.indexOf( sectionName );
		if ( lastActiveSession !== -1 ) {
			this.session.caseSections.splice( lastActiveSession, 1 );

			// If no sections remain, clear the session.
			if ( this.session.caseSections.length === 0 ) {
				await this.closeSession( casePage );
				// Don't remove from casePage if there are no sections left, or
				// else "continue where you left off" won't work.
			} else {
				await this.setSession( this.session );
				await casePage.removeActiveSection( sectionName );
				this.addSectionOverlay( casePage, heading );
			}
		}

		if ( this.session == null ) {
			// Re-append Deputy session entry interface elements.
			// Put in a self-executing function to run asynchronously from closeSection.
			( () => {
				this.init();
			} )();
		}
	}

}
