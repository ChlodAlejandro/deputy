// #if _DEV
/**
 * Loads a module in development. Only works in development contexts.
 *
 * @param moduleCode
 */
export default async function dynamicDevModuleLoad( moduleCode: string ) {
	console.warn( '[Deputy] Dynamically loading a module from localhost. This may be bad!' );
	return new Promise( ( res, rej ) => mw.loader.getScript(
		`http://localhost:45000/deputy-${ moduleCode }.js`
	).then( res, rej ) );
}
// #endif _DEV
