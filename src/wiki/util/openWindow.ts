/**
 * Opens a temporary window. Use this for dialogs that are immediately destroyed
 * after running. Do NOT use this for re-openable dialogs, such as the main ANTE
 * dialog.
 *
 * @param window
 */
import unwrapWidget from '../../util/unwrapWidget';
import removeElement from '../../util/removeElement';

/**
 *
 * @param window
 */
export default function openWindow( window: any ): void {

	let wm = new OO.ui.WindowManager();
	document.getElementsByTagName( 'body' )[ 0 ].appendChild( unwrapWidget( wm ) );
	wm.addWindows( [ window ] );
	wm.openWindow( window );
	wm.on( 'closing', ( win: any, closed: Promise<void> ) => {
		closed.then( () => {
			if ( wm ) {
				const _wm = wm;
				wm = null;
				removeElement( unwrapWidget( _wm ) );
				_wm.destroy();
			}
		} );
	} );

}
