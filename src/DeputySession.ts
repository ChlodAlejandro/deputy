import DeputyCasePage, { ContributionSurveyHeading } from './wiki/DeputyCasePage';
import sectionHeadingName from './util/sectionHeadingName';

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
	 * Initialize session-related information. If an active session was detected,
	 * restart it.
	 */
	async init() {
		// Check if there is an active session.
		const session = await this.getSession();
		if ( session ) {
			if ( session.casePageId === window.deputy.currentPageId ) {
				await this.initSessionInterface();
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
	 * Initialize interface components for an active session.
	 */
	async initSessionInterface() {
		// TODO: Do interface functions
	}

	/**
	 * Initialize interface components for *starting* a session. This includes
	 * the `[start CCI session]` notice at the top of each CCI page section heading.
	 */
	initEntryInterface(): void {
		const casePage = new DeputyCasePage();
		casePage.findContributionSurveyHeadings()
			.forEach( ( heading ) => {
				const before = document.createElement( 'span' );
				before.classList.add( 'dp-sessionStarter-bracket' );
				before.innerText = '[';

				const link = document.createElement( 'a' );
				link.innerText = mw.message( 'deputy.session.start' ).text();
				link.addEventListener( 'click', () => {
					this.startSession( heading );
				} );

				const after = document.createElement( 'span' );
				after.classList.add( 'dp-sessionStarter-bracket' );
				after.innerText = ']';

				const container = document.createElement( 'span' );
				container.classList.add( 'deputy', 'dp-sessionStarter' );
				container.appendChild( before );
				container.appendChild( link );
				container.appendChild( after );

				heading.appendChild( container );
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
		this.setSession( {
			casePageId: pageID,
			caseSections: [ sectionName ]
		} );

		this.initSessionInterface();
	}

}
