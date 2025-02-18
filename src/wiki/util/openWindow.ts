import unwrapWidget from '../../util/unwrapWidget';
import removeElement from '../../util/removeElement';

export let windowManager: OO.ui.WindowManager;

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
		if ( !windowManager ) {
			windowManager = new OO.ui.WindowManager();
			const parent = document.getElementById( 'mw-teleport-target' ) ??
				document.getElementsByTagName( 'body' )[ 0 ];

			parent.appendChild(
				unwrapWidget( windowManager )
			);
		}
		windowManager.addWindows( [ window ] );
		windowManager.openWindow( window );
		windowManager.on( 'closing', ( win, closed ) => {
			closed.then( () => {
				if ( windowManager ) {
					const _wm = windowManager;
					windowManager = null;
					removeElement( unwrapWidget( _wm ) );
					_wm.destroy();
					res();
				}
			} );
		} );
	} );
}
