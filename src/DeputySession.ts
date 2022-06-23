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
				await this.initInterface();
			} else {
				// TODO: Show "start work" with session replacement warning
			}
		} else {
			// No active session, stand down.
		}
	}

	/**
	 * Initialize interface components for an active session.
	 */
	async initInterface() {
		// TODO: Do interface functions
	}

	/**
	 *
	 */
	async initDeputySessionInterface() {
		// TODO: Grey out everything except the parts we need
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

}
