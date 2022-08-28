/**
 * Attempt to guess the author of a comment from the comment signature.
 *
 * @param comment The comment to read.
 * @return The author of the comment
 */
export default function ( comment: string ): string {
	const userRegex = /\[\[User(?:[ _]talk)?:([^|\]]+?)(?:\|[^\]]+?|]])/g;

	const matches = [];
	let match = userRegex.exec( comment );
	while ( match != null ) {
		matches.push( match[ 1 ] );
		match = userRegex.exec( comment );
	}

	return matches.length === 0 ? null : matches[ matches.length - 1 ];
}
