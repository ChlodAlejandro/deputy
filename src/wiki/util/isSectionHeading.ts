/**
 * Determine if an element is a valid MediaWiki section heading.
 *
 * @param el
 * @return `true` if the given heading is part of a MediaWiki section heading.
 */
export default function ( el: HTMLElement ): boolean {
	// All headings (h1, h2, h3, h4, h5, h6)
	const headlineElement = el.ownerDocument.querySelector( '.parsoid-body' ) != null ?
		el :
		el.querySelector<HTMLElement>( '.mw-headline' );

	// Handle DiscussionTools case (.mw-heading)
	return ( el.classList.contains( 'mw-heading' ) || /^H\d$/.test( el.tagName ) ) &&
		headlineElement != null;
}
