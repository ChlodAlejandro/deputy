interface SessionInformation {
	case: string;
	casePage: string;
	caseSections: number[];
}

/**
 * Handles the active Deputy session and sets up inter-tab communication.
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
			// Activate interface now (picking up from refreshed tab or window)
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
	getSession(): Promise<SessionInformation|undefined> {
		return window.deputy.storage.db.get( 'keyval', 'session' )
			.then(
				( session ) =>
					session?.value as SessionInformation|undefined
			);
	}

	/**
	 * Sets the current active session information.
	 *
	 * @param session The session to save.
	 * @return boolean `true` if successful.
	 */
	setSession( session: SessionInformation ): Promise<boolean> {
		return window.deputy.storage.db.put( 'keyval', {
			key: 'session',
			value: session
		} ).then( () => true );
	}

}
