/**
 * Evaluates any string using `mw.msg`. This handles internationalization of strings
 * that are loaded outside the script or asynchronously.
 *
 * @param string The string to evaluate
 * @param {...any} parameters Parameters to pass, if any
 * @return A mw.Message
 */
export default function msgEval( string: string, ...parameters: string[] ): mw.Message {
	const m = new mw.Map();
	m.set( 'msg', string );
	return new mw.Message( m, 'msg', parameters );
}
