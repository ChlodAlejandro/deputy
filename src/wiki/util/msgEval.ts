/**
 * Evaluates any string using `mw.msg`. This handles internationalization of strings
 * that are loaded outside the script or asynchronously.
 *
 * @param string The string to evaluate
 * @param namedParameters Named parameters to evaluate. Uses `$` notation.
 * @param {...any} parameters Parameters to pass, if any
 * @return A mw.Message
 */
export default function msgEval(
	string: string,
	namedParameters: Record<string, string>,
	...parameters: string[]
): mw.Message;
/**
 * Evaluates any string using `mw.msg`. This handles internationalization of strings
 * that are loaded outside the script or asynchronously.
 *
 * @param string The string to evaluate
 * @param {...any} parameters Parameters to pass, if any
 * @return A mw.Message
 */
export default function msgEval( string: string, ...parameters: string[] ): mw.Message;
/**
 * Evaluates any string using `mw.msg`. This handles internationalization of strings
 * that are loaded outside the script or asynchronously.
 *
 * @param string The string to evaluate
 * @param {...any} parameters Parameters to pass, if any
 * @return A mw.Message
 */
export default function msgEval( string: string, ...parameters: any[] ): mw.Message {
	// Named parameters
	let named: Record<string, string> = {};
	if ( typeof parameters[ 0 ] === 'object' ) {
		named = parameters.shift();
	}
	const m = new mw.Map();

	for ( const [ from, to ] of Object.entries( named ) ) {
		string = string.replace( new RegExp( `\\$${from}`, 'g' ), to );
	}

	m.set( 'msg', string );
	return new mw.Message( m, 'msg', parameters );
}
