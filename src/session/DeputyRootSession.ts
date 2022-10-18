import DeputyCasePage, { ContributionSurveyHeading } from '../wiki/DeputyCasePage';
import DeputyCCISessionStartLink from '../ui/root/DeputyCCISessionStartLink';
import DeputyCCISessionContinueMessage from '../ui/root/DeputyCCISessionContinueMessage';
import removeElement from '../util/removeElement';
import unwrapWidget from '../util/unwrapWidget';
import swapElements from '../util/swapElements';
import DeputyCCISessionTabActiveMessage from '../ui/root/DeputyCCISessionTabActiveMessage';
import sectionHeadingName from '../wiki/util/sectionHeadingName';
import {
	DeputyMessageEvent,
	DeputySessionRequestMessage,
	DeputySessionStopMessage
} from '../DeputyCommunications';
import DeputyCCISessionAddSection from '../ui/root/DeputyCCISessionAddSection';
import DeputyContributionSurveySection from '../ui/root/DeputyContributionSurveySection';
import { SessionInformation } from './DeputySession';
import DeputyCCISessionOverwriteMessage from '../ui/root/DeputyCCISessionOverwriteMessage';
import { ArrayOrNot } from '../types';

/**
 * The DeputyRootSession. Instantiated only when:
 *  (a) the page is a CCI case page, and
 *  (b) a session is currently active
 */
export default class DeputyRootSession {

	/*
	 * =========================================================================
	 * STATIC AND SESSION-LESS FUNCTIONS
	 * =========================================================================
	 */

	/**
	 * Initialize interface components for *starting* a session. This includes
	 * the `[start CCI session]` notice at the top of each CCI page section heading.
	 *
	 * @param _casePage The current case page
	 */
	static async initEntryInterface( _casePage?: DeputyCasePage ): Promise<void> {
		const continuing = _casePage != null;
		const casePage = continuing ? _casePage : await DeputyCasePage.build();
		const startLink: HTMLElement[] = [];

		casePage.findContributionSurveyHeadings()
			.forEach( ( heading: ContributionSurveyHeading ) => {
				const link = DeputyCCISessionStartLink( heading, casePage );
				startLink.push( link as HTMLElement );
				heading.appendChild( link );
			} );

		window.deputy.comms.addEventListener( 'sessionStarted', () => {
			// Re-build interface.
			startLink.forEach( ( link: HTMLElement ) => {
				removeElement( link );
			} );
			window.deputy.session.init();
		}, { once: true } );
	}

	/**
	 * Shows the interface for continuing a previous session. This includes
	 * the `[continue CCI session]` notice at the top of each CCI page section heading
	 * and a single message box showing when the page was last worked on on top of the
	 * first CCI heading found.
	 *
	 * @param casePage The case page to continue with
	 */
	static async initOverwriteMessage( casePage: DeputyCasePage ): Promise<void> {
		await mw.loader.using(
			[ 'oojs-ui-core', 'oojs-ui.styles.icons-content' ],
			() => {
				const firstHeading = casePage.findContributionSurveyHeadings()[ 0 ];
				if ( firstHeading ) {
					// Insert element directly into widget (not as text, or else event
					// handlers will be destroyed).
					const messageBox = new OO.ui.MessageWidget( {
						classes: [
							'deputy', 'dp-cs-session-notice', 'dp-cs-session-otherActive'
						],
						type: 'notice',
						icon: 'alert',
						label: new OO.ui.HtmlSnippet(
							DeputyCCISessionOverwriteMessage().innerHTML
						)
					} );

					const stopButton = new OO.ui.ButtonWidget( {
						classes: [ 'dp-cs-session-stop' ],
						label: mw.msg( 'deputy.session.otherActive.button' ),
						flags: [ 'primary', 'destructive' ]
					} );
					stopButton.on( 'click', async () => {
						const session = await window.deputy.comms.sendAndWait( {
							type: 'sessionStop'
						} );

						if ( session === null ) {
							// Session did not close cleanly. Tab must be closed. Force-stop
							// the session.
							await window.deputy.session.clearSession();
							removeElement( unwrapWidget( messageBox ) );
							await window.deputy.session.init();
						} else {
							// Handled by session close listener.
						}
					} );
					window.deputy.comms.addEventListener( 'sessionClosed', () => {
						// Closed externally. Re-build interface.
						removeElement( unwrapWidget( messageBox ) );
						window.deputy.session.init();
					} );
					swapElements(
						unwrapWidget( messageBox )
							.querySelector( '.dp-cs-session-stop' ),
						unwrapWidget( stopButton )
					);

					firstHeading.insertAdjacentElement(
						'beforebegin',
						unwrapWidget( messageBox )
					);
				}
			}
		);
	}

	/**
	 * Shows the interface for continuing a previous session. This includes
	 * the `[continue CCI session]` notice at the top of each CCI page section heading
	 * and a single message box showing when the page was last worked on on top of the
	 * first CCI heading found.
	 *
	 * @param casePage The case page to continue with
	 */
	static async initContinueInterface( casePage: DeputyCasePage ): Promise<void> {
		await Promise.all( [
			DeputyRootSession.initEntryInterface(),
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
								DeputyCCISessionContinueMessage( {
									casePage: casePage
								} ).innerHTML
							)
						} );

						const continueButton = new OO.ui.ButtonWidget( {
							classes: [ 'dp-cs-session-continue' ],
							label: mw.msg( 'deputy.session.continue.button' ),
							flags: [ 'primary', 'progressive' ]
						} );
						const sessionStartListener = async () => {
							removeElement( unwrapWidget( messageBox ) );
							await this.initTabActiveInterface();
						};
						continueButton.on( 'click', () => {
							removeElement( unwrapWidget( messageBox ) );
							DeputyRootSession.continueSession( casePage );
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
	 * @param _casePage The current case page (not the active one)
	 */
	static async initTabActiveInterface( _casePage?: DeputyCasePage ): Promise<void> {
		const casePage = _casePage ?? await DeputyCasePage.build();

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
							await window.deputy.session.init();
						},
						{ once: true }
					);
				}
			}
		);
	}

	/**
	 * Starts a Deputy session.
	 *
	 * @param section
	 * @param _casePage
	 */
	static async startSession(
		section: ArrayOrNot<ContributionSurveyHeading>,
		_casePage?: DeputyCasePage
	): Promise<void> {
		const sectionNames = ( Array.isArray( section ) ? section : [ section ] ).map(
			( _section ) => sectionHeadingName( _section )
		);

		// Save session to storage
		const casePage = _casePage ?? await DeputyCasePage.build();
		const session = await this.setSession( {
			casePageId: casePage.pageId,
			caseSections: sectionNames
		} );

		const rootSession =
			window.deputy.session.rootSession =
				new DeputyRootSession( session, casePage );
		await casePage.bumpActive();
		await rootSession.initSessionInterface();
	}

	/**
	 * Continue a session from a DeputyCasePage.
	 *
	 * @param casePage The case page to continue with
	 */
	static async continueSession( casePage: DeputyCasePage ): Promise<void> {
		// Save session to storage
		const session = await this.setSession( {
			casePageId: casePage.pageId,
			// Shallow array copy
			caseSections: [ ...casePage.lastActiveSections ]
		} );

		const rootSession =
			window.deputy.session.rootSession =
				new DeputyRootSession( session, casePage );
		await casePage.bumpActive();
		await rootSession.initSessionInterface();
	}

	/**
	 * Sets the current active session information.
	 *
	 * @param session The session to save.
	 * @return SessionInformation object if successful, `null` if not.
	 */
	static async setSession( session: SessionInformation ): Promise<SessionInformation> {
		return ( await window.deputy.storage.setKV( 'session', session ) ) ? session : null;
	}

	/**
	 * The current active session, if one exists.
	 */
	session: SessionInformation;
	/**
	 * The case page that this root session is handling.
	 */
	casePage: DeputyCasePage;
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
	readonly sessionStopResponder = this.handleStopRequest.bind( this );

	/*
	 * =========================================================================
	 *  INSTANCE AND ACTIVE SESSION FUNCTIONS
	 * =========================================================================
	 */

	/**
	 * @param session
	 * @param casePage
	 */
	constructor( session: SessionInformation, casePage: DeputyCasePage ) {
		this.session = session;
		this.casePage = casePage;
	}

	/**
	 * Initialize interface components for an active session. This will always run in the
	 * context of a CCI case page.
	 */
	async initSessionInterface(): Promise<void> {
		if ( window.location.search.indexOf( 'action=edit' ) !== -1 ) {
			// User is editing, don't load interface.
			return;
		}
		if ( await window.deputy.session.checkForActiveSessionTabs() ) {
			// User is on another tab, don't load interface.
			mw.loader.using( [ 'oojs-ui-core', 'oojs-ui-windows' ], () => {
				OO.ui.alert(
					mw.msg( 'deputy.session.tabActive.help' ),
					{ title: mw.msg( 'deputy.session.tabActive.head' ) }
				);
			} );
			return;
		}

		removeElement( this.casePage.document.querySelector( '.dp-cs-session-lastActive' ) );
		this.casePage.document.querySelectorAll( '.dp-sessionStarter' )
			.forEach( ( el: HTMLElement ) => {
				removeElement( el );
			} );

		window.deputy.comms.addEventListener( 'sessionRequest', this.sessionRequestResponder );
		window.deputy.comms.addEventListener( 'sessionStop', this.sessionStopResponder );
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

				document.getElementsByTagName( 'body' )[ 0 ]
					.appendChild( window.deputy.windowManager.$element[ 0 ] );

				// TODO: Do interface functions
				this.sections = [];

				const activeSectionPromises = [];
				for ( const heading of this.casePage.findContributionSurveyHeadings() ) {
					const headingName = sectionHeadingName( heading );

					if ( this.session.caseSections.indexOf( headingName ) !== -1 ) {
						activeSectionPromises.push(
							this.activateSection( this.casePage, heading )
								.then( v => v ? headingName : null )
						);
					} else {
						this.addSectionOverlay( this.casePage, heading );
					}
				}

				// Strip missing sections from caseSections.
				this.session.caseSections = ( await Promise.all( activeSectionPromises ) )
					.filter( v => !!v );
				await DeputyRootSession.setSession( this.session );

				if ( this.session.caseSections.length === 0 ) {
					// No sections re-opened. All of them might have been removed or closed already.
					// Close this entire session.
					await this.closeSession();
				}

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
	 * Handles a session stop request.
	 *
	 * @param event
	 */
	async handleStopRequest(
		event: DeputyMessageEvent<DeputySessionStopMessage>
	): Promise<void> {
		await this.closeSession();
		window.deputy.comms.reply(
			event.data, {
				type: 'acknowledge'
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
	 * Closes all active session-related UI components. Done prior to closing
	 * a section or reloading the interface.
	 */
	closeSessionUI(): void {
		if ( this.sections ) {
			for ( const section of this.sections ) {
				section.close();
			}
		}

		this.casePage.document.querySelectorAll( '.dp-cs-section-add' )
			.forEach( ( el: HTMLElement ) => removeElement( el ) );
	}

	/**
	 * Closes the current session.
	 */
	async closeSession(): Promise<void> {
		this.closeSessionUI();

		await this.casePage.saveToCache();
		const oldSessionId = this.session.casePageId;
		window.deputy.comms.removeEventListener(
			'sessionRequest', this.sessionRequestResponder
		);
		await window.deputy.session.clearSession();
		window.deputy.comms.send( { type: 'sessionClosed', caseId: oldSessionId } );

		// Re-initialize session interface objects.
		await window.deputy.session.init();
	}

	/**
	 * Activates a section. This appends the section UI, adds the section to the
	 * cache (if not already added), and internally stores the section for a
	 * graceful exit.
	 *
	 * @param casePage
	 * @param heading
	 * @return `true` if the section was activated successfully
	 */
	async activateSection(
		casePage: DeputyCasePage,
		heading: ContributionSurveyHeading
	): Promise<boolean> {
		const el = new DeputyContributionSurveySection( casePage, heading );
		if ( !( await el.prepare() ) ) {
			return false;
		}

		const sectionName = sectionHeadingName( heading );
		this.sections.push( el );
		const lastActiveSession = this.session.caseSections.indexOf( sectionName );
		if ( lastActiveSession === -1 ) {
			this.session.caseSections.push( sectionName );
			await DeputyRootSession.setSession( this.session );
		}
		await casePage.addActiveSection( sectionName );

		heading.insertAdjacentElement( 'afterend', el.render() );
		await el.loadData();
		mw.hook( 'deputy.load.cci.root' ).fire();

		return true;
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
				await this.closeSession();
				// Don't remove from casePage if there are no sections left, or
				// else "continue where you left off" won't work.
			} else {
				await DeputyRootSession.setSession( this.session );
				await casePage.removeActiveSection( sectionName );
				this.addSectionOverlay( casePage, heading );
			}
		}
	}

}
