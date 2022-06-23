import * as path from 'path';

/**
 * Loads the Deputy script into the current browser context.
 */
export default async function () {
	return page.addScriptTag( {
		path: path.resolve( __dirname, '..', '..', 'build', 'Deputy.js' )
	} ).then( async () => {
		// Begin waiting for script initialization.
		const success = await page.evaluate( () => {
			let interval: NodeJS.Timeout;

			// Wait 60 seconds for initialization, die if not injected by then.
			return new Promise<boolean>( ( res ) => {
				mw.hook( 'deputy.load' ).add( () => res( true ) );
				setTimeout( () => {
					res( false );
				}, 60e3 );
			} ).then( ( v ) => {
				clearInterval( interval );
				return v;
			} );
		} );

		if ( !success ) {
			throw new Error( 'Failed to load Deputy script in time.' );
		} else {
			return true;
		}
	} );
}
