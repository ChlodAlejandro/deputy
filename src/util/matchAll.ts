import cloneRegex from './cloneRegex';

/**
 * Replacement for String.prototype.matchALl (ES2020 only)
 *
 * @param _regex The regular expression to exec with
 * @param string The string to exec against
 * @return The matches found
 */
export default function matchAll( _regex: RegExp, string: string ): RegExpExecArray[] {
	const regex = cloneRegex( _regex );

	const res = [];
	let current = regex.exec( string );
	while ( current != null ) {
		res.push( current );
		current = regex.exec( string );
	}

	return res;
}
