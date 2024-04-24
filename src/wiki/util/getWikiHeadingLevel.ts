import last from '../../util/last';

/**
 * Get the level (1 to 6) of any parsed wikitext heading.
 *
 * This is its own function to account for different parse outputs (Legacy, Parsoid,
 * DiscussionTools, etc.)
 *
 * @param el The element to check. This MUST be a wikitext heading.
 * @return The level of the heading (1 to 6)
 */
export default function getWikiHeadingLevel( el: Element ) {
	const h = el.classList.contains( 'mw-heading' ) ?
		el.querySelector( 'h1, h2, h3, h4, h5, h6' ) :
		el;

	// Check if this is a valid header
	if ( !/^H\d+$/.test( h.tagName ) ) {
		throw new Error( 'Heading element does not contain a valid <h*> element' );
	}

	return +last( h.tagName ) as 1 | 2 | 3 | 4 | 5 | 6;
}
