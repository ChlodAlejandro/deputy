import cloneRegex from '../util/cloneRegex';

/**
 * Used for detecting Deputy traces.
 */
export const traceRegex = /<!--\s*(?:User:)?(.+?)\s*\|\s*(.+?)\s*-->\s*$/g;

/**
 * Generates the Deputy trace, used to determine who assessed a row.
 *
 * @return the Deputy trace
 */
export function generateTrace(): string {
	return `<!-- User:${mw.user.getName()}|${new Date().toISOString()} -->`;
}

/**
 * Attempts to extract the Deputy trace from wikitext.
 *
 * @param wikitext
 * @return The trace author and timestamp (if available), or null if a trace was not found.
 */
export function guessTrace( wikitext: string ): { author: string, timestamp: Date | null } | null {
	const traceExec = cloneRegex( traceRegex ).exec( wikitext );
	if ( traceExec ) {
		return {
			author: traceExec[ 1 ],
			timestamp: new Date( traceExec[ 2 ] )
		};
	} else {
		return null;
	}
}
