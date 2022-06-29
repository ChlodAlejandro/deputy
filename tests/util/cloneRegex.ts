/**
 * Clones a regular expression.
 *
 * @param regex The regular expression to clone.
 * @return A new regular expression object.
 */
export default function ( regex: RegExp ): RegExp {
	return new RegExp( regex.source, regex.flags );
}
