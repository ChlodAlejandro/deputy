import { DeputyPageStatusResponseMessage } from '../DeputyCommunications';
import DeputyPageToolbar from '../ui/page/DeputyPageToolbar';

/**
 * Controls everything related to a page that is the subject of an active
 * Deputy row.
 */
export default class DeputyPageSession {

	/**
	 * Attempts to grab page details from a session. If a session does not exist,
	 * this will return null.
	 *
	 * @param title The title of the page to get information for. Defaults to current.
	 * @param revision The revision of the page to get information for.
	 *  If the page is being viewed normally (not in a diff or permanent link), then
	 *  this value should be set to null. This ensures that a generic toolbar is
	 *  used instead of the revision-specific toolbar.
	 */
	static async getPageDetails(
		title: mw.Title,
		revision?: number
	): Promise<DeputyPageStatusResponseMessage | null> {
		return window.deputy.comms.sendAndWait( {
			type: 'pageStatusRequest',
			page: title.getPrefixedText(),
			revision: revision
		} );
	}

	/**
	 *
	 * @param data
	 */
	init( data: DeputyPageStatusResponseMessage ) {
		mw.loader.using( [
			'oojs-ui-core',
			'oojs-ui-windows',
			'oojs-ui.styles.icons-interactions',
			'oojs-ui.styles.icons-movement'
		], async () => {
			const toolbar = new DeputyPageToolbar( data );
			await toolbar.prepare();
			document.getElementsByTagName( 'body' )[ 0 ].appendChild( toolbar.render() );
		} );
	}

}
