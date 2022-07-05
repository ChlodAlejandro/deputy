import DeputyCasePage, { ContributionSurveyHeading } from './wiki/DeputyCasePage';
import sectionHeadingName from './util/sectionHeadingName';
import DeputyContributionSurveySection from './ui/DeputyContributionSurveySection';
import DeputyCCISessionStartLink from './ui/DeputyCCISessionStartLink';

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
	 * A DiscussionTools Parser. Used for parsing comments in a streamlined way (using
	 * DiscussionTools) as compared to relying on an in-house parser.
	 */
	parser: any;

	/**
	 * Initialize session-related information. If an active session was detected,
	 * restart it.
	 */
	async init() {
		// Check if there is an active session.
		const session = await this.getSession();
		if ( session ) {
			if ( session.casePageId === window.deputy.currentPageId ) {
				await this.initSessionInterface( session );
			} else {
				// TODO: Show "start work" with session replacement warning
			}
		} else {
			// No active session
			if ( DeputyCasePage.isCasePage() ) {
				// Show session start buttons
				this.initEntryInterface();
			}
		}
	}

	/**
	 * Initialize interface components for an active session. This will always run in the
	 * context of a CCI case page.
	 *
	 * @param session
	 * @param casePage
	 */
	async initSessionInterface(
		session: SessionInformation,
		casePage = new DeputyCasePage()
	): Promise<void> {
		if ( window.location.search.indexOf( 'action=edit' ) !== -1 ) {
			// User is editing, don't load interface.
			return;
		}

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

				// TODO: Do interface functions
				for ( const section of session.caseSections ) {
					const heading = casePage.findContributionSurveyHeading( section );

					if ( !heading ) {
						// The section is assumed missing.
						const sessionIndex = session.caseSections.indexOf( section );
						session.caseSections.splice( sessionIndex, 1 );
						continue;
					}

					const el = new DeputyContributionSurveySection( casePage, heading );
					await el.prepare();
					heading.insertAdjacentElement( 'afterend', el.render() );
				}
				res();
			} );
		} );
	}

	/**
	 * Initialize interface components for *starting* a session. This includes
	 * the `[start CCI session]` notice at the top of each CCI page section heading.
	 */
	initEntryInterface(): void {
		const casePage = new DeputyCasePage();
		casePage.findContributionSurveyHeadings()
			.forEach( ( heading ) => {
				heading.appendChild(
					DeputyCCISessionStartLink( heading, this )
				);
			} );
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
		return window.deputy.storage.setKV( 'session', session );
	}

	/**
	 * Starts a Deputy session.
	 *
	 * @param section
	 */
	startSession( section: ContributionSurveyHeading ): void {
		const pageID = window.deputy.currentPageId;
		const sectionName = sectionHeadingName( section );

		// Save session to storage
		window.deputy.storage.db.put( 'casePageCache', {
			pageID: pageID,
			lastActive: Date.now(),
			lastActiveSections: [ sectionName ]
		} );
		const session = {
			casePageId: pageID,
			caseSections: [ sectionName ]
		};
		this.setSession( session );

		// TODO: Make DeputyCasePage instantiated based on current page and use that here.
		this.initSessionInterface( session );
	}

}
