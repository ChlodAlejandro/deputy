interface SessionInformation {
	case: string;
	casePage: string;
	caseSections: number[];
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
			// If on the correct page,
			// TODO: Activate interface now (picking up from refreshed tab or window)
			// If on another page,
			/*
			 TODO: Detect if the current page is part of an active session, and if it is, display
			  toolbar.
			 */
		} else {
			// No active session, stand down.
		}
	}

	/**
	 * Gets the current active session information.
	 *
	 * @return {Promise<SessionInformation|undefined>}
	 *     A promise that resolves with the session information or `undefined` if session
	 *     information is not available.
	 */
	async getSession(): Promise<SessionInformation|undefined> {
		return ( await window.deputy.storage.getKV( 'session' ) ) as SessionInformation|undefined;
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
