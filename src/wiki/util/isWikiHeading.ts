/**
 * Check if a given parameter is a wikitext heading parsed into HTML.
 *
 * This is its own function to account for different parse outputs (Legacy, Parsoid,
 * DiscussionTools, etc.)
 *
 * @param el The element to check
 * @return `true` if the element is a heading, `false` otherwise
 */
export default function isWikiHeading( el: Element ): boolean {
	return ( el.classList.contains( 'mw-heading' ) || /^H\d$/.test( el.tagName ) );
}
