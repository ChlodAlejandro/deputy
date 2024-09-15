import {
	DeputyPageStatusResponseMessage
} from '../DeputyCommunications';
import DeputyPageToolbar, { DeputyPageToolbarOptions } from '../ui/page/DeputyPageToolbar';

/**
 * Controls everything related to a page that is the subject of an active
 * Deputy row.
 */
export default class DeputyPageSession {

	/**
	 * Attempts to grab page details from a session. If a session does not exist,
	 * this will return null.
	 *
	 * @param revision The revision of the page to get information for.
	 *  If the page is being viewed normally (not in a diff or permanent link), then
	 *  this value should be set to null. This ensures that a generic toolbar is
	 *  used instead of the revision-specific toolbar.
	 * @param title The title of the page to get information for. Defaults to current.
	 * @param timeout Timeout for the page detail request.
	 */
	static async getPageDetails(
		revision = mw.config.get( 'wgRevisionId' ),
		title: mw.Title = window.deputy.currentPage,
		timeout = 500
	): Promise<DeputyPageStatusResponseMessage | null> {
		return window.deputy.comms.sendAndWait( {
			type: 'pageStatusRequest',
			page: title.getPrefixedText(),
			revision: revision
		}, timeout );
	}

	/**
	 * An active DeputyPageToolbar, if any is available.
	 */
	toolbar: DeputyPageToolbar;

	readonly sessionCloseHandler = this.onSessionClosed.bind( this );

	/**
	 * @param data
	 */
	init( data: DeputyPageStatusResponseMessage ) {
		window.deputy.comms.addEventListener( 'sessionClosed', this.sessionCloseHandler );

		// Spawn toolbar
		if ( window.deputy.config.cci.enablePageToolbar.get() ) {
			mw.loader.using( [
				'oojs-ui-core',
				'oojs-ui-windows',
				'oojs-ui-widgets',
				'oojs-ui.styles.icons-interactions',
				'oojs-ui.styles.icons-movement',
				'oojs-ui.styles.icons-moderation',
				'oojs-ui.styles.icons-media',
				'oojs-ui.styles.icons-editing-advanced',
				'oojs-ui.styles.icons-editing-citation'
			], () => {
				if ( mw.config.get( 'wgDiffNewId' ) === null ) {
					// Not on a diff page, but wgRevisionId is populated nonetheless.
					this.initInterface( data );
				} else {
					mw.hook( 'wikipage.diff' ).add( async () => {
						await this.initInterface( data );
					} );
				}
			} );
		}
	}

	/**
	 * Initialize the interface.
	 *
	 * @param data
	 */
	async initInterface( data: DeputyPageStatusResponseMessage ) {
		// Attempt to get new revision data *with revision ID*.
		const isCurrentDiff = /[?&]diff=0+(\D|$)/.test( window.location.search );
		data = await DeputyPageSession.getPageDetails(
			( isCurrentDiff ?
				// On a "cur" diff page
				mw.config.get( 'wgDiffOldId' ) :
				// On a "prev" diff page
				mw.config.get( 'wgDiffNewId' ) ) ||
			mw.config.get( 'wgRevisionId' ),
			window.deputy.currentPage,
			// Relatively low-stakes branch, we can handle a bit of a delay.
			2000
		);

		const openPromise = this.appendToolbar( {
			...data,
			forceRevision: this.toolbar != null ||
				// Is a diff page.
				mw.config.get( 'wgDiffNewId' ) != null
		} );

		if (
			// Previous toolbar exists. Close it before moving on.
			this.toolbar &&
			this.toolbar.revision !== mw.config.get( 'wgRevisionId' )
		) {
			const oldToolbar = this.toolbar;
			openPromise.then( () => {
				oldToolbar.close();
			} );

		}

		this.toolbar = await openPromise;
	}

	/**
	 * Creates the Deputy page toolbar and appends it to the DOM.
	 *
	 * @param data Data for constructing the toolbar
	 */
	async appendToolbar( data: DeputyPageToolbarOptions ): Promise<DeputyPageToolbar> {
		const toolbar = new DeputyPageToolbar( data );
		await toolbar.prepare();

		document.getElementsByTagName( 'body' )[ 0 ]
			.appendChild( toolbar.render() );

		return toolbar;
	}

	/**
	 * Cleanup toolbar, remove event listeners, and remove from DOM.
	 */
	close(): void {
		this.toolbar?.close();
		window.deputy.comms.removeEventListener( 'sessionClosed', this.sessionCloseHandler );
	}

	/**
	 * Handler for when a session is closed.
	 */
	onSessionClosed(): void {
		this.close();
	}

}
