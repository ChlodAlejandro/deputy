import getPageExists from '../wiki/util/getPageExists';

/**
 * Load a module from a string.
 *
 * @param moduleName
 */
export default async function dynamicModuleLoad( moduleName: string ) {
	/**
	 * This is a very sensitive variable!
	 *
	 * Ensure that not anyone can modify these. This usually comes as interface admin
	 * protection or userspace protection.
	 *
	 * LOADING FROM PAGES THAT CAN BE EDITED BY ANYONE CAN LEAD TO SECURITY
	 * IMPLICATIONS!
	 */
	const expectedLocations = [
		`MediaWiki:Gadget-${ moduleName }-core.js`,
		`MediaWiki:Gadget-${ moduleName }.js`,
		`MediaWiki:Gadget-Deputy-${ moduleName }-core.js`,
		`MediaWiki:Gadget-Deputy-${ moduleName }.js`,
		`MediaWiki:${ moduleName }-core.js`,
		`MediaWiki:${ moduleName }.js`,
		`User:Chlod/Scripts/Deputy/${ moduleName }-core.js`,
		`User:Chlod/Scripts/Deputy/${ moduleName }.js`
		// Security implications of this TBD.
		// `Gadget:${ moduleName }-core.js`,
		// `Gadget:${ moduleName }.js`
	];

	// Check which of those has something in it.
	const ape = await getPageExists( expectedLocations );
	if ( ape.length > 0 ) {
		// Page exists! Load it.
		return new Promise( ( res, rej ) => {
			mw.loader.getScript( mw.util.getUrl( ape[ 0 ] ) ).then( res, rej );
		} );
	} else {
		// Nothing got loaded.
		return Promise.reject( new Error( 'Could not find a script to load.' ) );
	}
}
