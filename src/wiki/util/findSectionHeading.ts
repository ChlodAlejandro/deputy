/**
 * Finds a MediaWiki section heading from the current DOM using its title.
 *
 * @param sectionHeadingName The name of the section to find.
 * @param n The `n` of the section. Starts at 1.
 * @return The found section heading. `null` if not found.
 */
export default function findSectionHeading(
	sectionHeadingName: string,
	n = 1
): HTMLElement | null {
	let currentN = 1;

	const headlines = Array.from( document.querySelectorAll(
		// Old style headings
		[ 1, 2, 3, 4, 5, 6 ].map( v => `h${v} > .mw-headline` ).join( ',' ) +
			',' +
			// New style headings
			[ 1, 2, 3, 4, 5, 6 ].map( v => `mw-heading > h${v}` ).join( ',' )
	) );
	for ( const el of headlines ) {
		if ( el instanceof HTMLElement && el.innerText === sectionHeadingName ) {
			if ( currentN >= n ) {
				return el.parentElement;
			} else {
				currentN++;
			}
		}
	}

	return null;
}
