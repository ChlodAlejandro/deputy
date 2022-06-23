import * as path from 'path';

/**
 * Loads the Deputy script into the current browser context.
 */
export default async function () {
	return page.addScriptTag( {
		path: path.resolve( __dirname, '..', '..', 'build', 'Deputy.js' )
	} ).then( () => {
		// Begin waiting for script initialization.
		const success = page.evaluate( () => {
			let interval: NodeJS.Timeout;

			// Wait 30 seconds for initialization, die if not injected by then.
			return new Promise<boolean>( ( res ) => {
				setInterval( () => {
					if ( window.deputy != null ) {
						res( true );
					}
				}, 10 );
				setTimeout( () => {
					res( false );
				}, 30e3 );
			} ).then( () => {
				clearInterval( interval );
			} );
		} );

		if ( !success ) {
			throw new Error( 'Failed to load Deputy script in time.' );
		} else {
			return true;
		}
	} );
}
