import unwrapWidget from '../../util/unwrapWidget';
import removeElement from '../../util/removeElement';

/**
 * Opens a temporary window. Use this for dialogs that are immediately destroyed
 * after running. Do NOT use this for re-openable dialogs, such as the main ANTE
 * dialog.
 *
 * @param window
 * @return A promise. Resolves when the window is closed.
 */
export default async function openWindow( window: OO.ui.Window ): Promise<void> {
	return new Promise( ( res ) => {
		let wm = new OO.ui.WindowManager();
		document.getElementsByTagName( 'body' )[ 0 ].appendChild( unwrapWidget( wm ) );
		wm.addWindows( [ window ] );
		wm.openWindow( window );
		wm.on( 'closing', ( win, closed ) => {
			closed.then( () => {
				if ( wm ) {
					const _wm = wm;
					wm = null;
					removeElement( unwrapWidget( _wm ) );
					_wm.destroy();
					res();
				}
			} );
		} );
	} );
}
