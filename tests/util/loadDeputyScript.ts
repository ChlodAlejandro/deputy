import * as path from 'path';

/**
 * Loads the Deputy script into the current browser context.
 *
 * @param timeout
 */
export default async function ( timeout = 60e3 ) {
	return page.addScriptTag( {
		path: path.resolve( __dirname, '..', '..', 'build', 'deputy.js' )
	} ).then( async () => {
		// Begin waiting for script initialization.
		const success = await page.evaluate( async ( _timeout ) => {
			// Wait 60 seconds for initialization, die if not injected by then.
			return new Promise<boolean>( ( res ) => {
				mw.hook( 'deputy.load' ).add( () => {
					res( true );
				} );
				setTimeout( () => {
					res( false );
				}, _timeout );
			} );
		}, timeout );

		if ( !success ) {
			throw new Error( 'Failed to load Deputy script in time.' );
		} else {
			return true;
		}
	} );
}
