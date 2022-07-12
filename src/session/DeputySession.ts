import DeputyCasePage from '../wiki/DeputyCasePage';
import DeputyRootSession from './DeputyRootSession';
import DeputyPageSession from './DeputyPageSession';

export interface SessionInformation {
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
 * Handles the active Deputy session.
 *
 * A "Session" is a period wherein Deputy exercises a majority of its features,
 * namely the use of inter-tab communication and database transactions for
 * page and revision caching. Other tabs that load Deputy will recognize the
 * started session and begin communicating with the root tab (the tab with the
 * CCI page, and therefore the main Deputy session handler, open). The handler
 * for root tab session activities is {@link DeputyRootSession}.
 */
export default class DeputySession {

	readonly DeputyRootSession = DeputyRootSession;

	/**
	 * The DeputyRootSession handles session functions for the root tab. The
	 * separation between DeputySession and DeputyRootSession is made to confine
	 * session-mutating functions within the root tab only.
	 */
	rootSession: DeputyRootSession;
	/**
	 * The DeputyPageSession handles session functions for a page that is the subject
	 * of a Deputy session. This object handles things such as synchronicity between
	 * the root tab and the page toolbar, interface handling, etc.
	 */
	pageSession: DeputyPageSession;

	/**
	 * Initialize session-related information. If an active session was detected,
	 * restart it.
	 */
	async init() {
		// Check if there is an active session.
		const session = await this.getSession();

		if ( session ) {
			const viewingCurrent =
				// Page is being viewed.
				mw.config.get( 'wgAction' ) === 'view' &&
				// Revision is current revision. Also handles wgRevisionId = 0
				// (which happens when viewing a diff).
				mw.config.get( 'wgRevisionId' ) ===
				mw.config.get( 'wgCurRevisionId' );

			if ( session.caseSections.length === 0 ) {
				// No more sections. Discard session.
				await this.clearSession();
				await this.init();
			} else if ( session.casePageId === window.deputy.currentPageId ) {
				// Definitely a case page, no need to question.
				const casePage = await DeputyCasePage.build();
				this.rootSession = new DeputyRootSession( session, casePage );

				if ( viewingCurrent && await this.checkForActiveSessionTabs() ) {
					// Session is active in another tab. Defer to other tab.
					await DeputyRootSession.initTabActiveInterface( casePage );
				} else if ( viewingCurrent ) {
					// Page reloaded or exited without proper session close.
					// Continue where we left off.
					await this.rootSession.initSessionInterface();
					await casePage.bumpActive();
				}
			} else if ( DeputyCasePage.isCasePage() ) {
				// TODO: Show "start work" with session replacement warning
				console.log( 'session replacement warning goes here' );
			} else {
				await this.normalPageInitialization();
				window.deputy.comms.addEventListener( 'sessionStarted', () => {
					// This misses by a few seconds right now since sessionStarted is
					// called when the sessionStarts but not when it is ready.
					// TODO: Fix that.
					this.normalPageInitialization();
				} );
			}
		} else {
			// No active session
			if ( DeputyCasePage.isCasePage() ) {
				const casePage = await DeputyCasePage.build();

				if ( await casePage.isCached() ) {
					await DeputyRootSession.initContinueInterface( casePage );
				} else {
					// Show session start buttons
					await DeputyRootSession.initEntryInterface( casePage );
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
	 * Detects if a session is currently active, attempt to get page details, and
	 * start a page session if details have been found.
	 *
	 * @return `true` if a session was started, `false` otherwise.
	 */
	async normalPageInitialization(): Promise<boolean> {
		// Normal page. Determine if this is being worked on, and then
		// start a new session if it is.
		const pageSession = await DeputyPageSession.getPageDetails(
			mw.config.get( 'wgDiffNewId' ) ||
			mw.config.get( 'wgRevisionId' )
		);

		if ( pageSession ) {
			// This page is being worked on, create a session.
			this.pageSession = new DeputyPageSession();
			this.pageSession.init( pageSession );
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Gets the current active session information. Session mutation functions (besides
	 * `clearSession`) are only available in {@link DeputyRootSession}.
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
	 * @return boolean `true` if successful.
	 */
	clearSession(): Promise<boolean> {
		if ( this.rootSession ) {
			this.rootSession.session = null;
		}
		return window.deputy.storage.setKV( 'session', null );
	}

}
