// #if _DEV
/**
 * Loads a module in development. Only works in development contexts.
 *
 * @param moduleCode
 */
export default async function dynamicDevModuleLoad( moduleCode: string ) {
	if ( process.env.NODE_ENV === 'development' ) {
		return new Promise( ( res, rej ) => mw.loader.getScript(
			`http://localhost:45000/${ moduleCode }.js`
		).then( res, rej ) );
	}
}
// #endif _DEV
