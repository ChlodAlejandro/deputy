/**
 * @param element The element to get the name of
 * @return the name of a section from its section heading.
 */
export default function sectionHeadingName( element: HTMLHeadingElement ): string {
	try {
		// Get only the direct text of .mw-headline
		// Why? Because DiscussionTools inserts a [subscribe] link in the .mw-headline
		// element, which we don't want to include in the section name.
		const headlineElement = element.querySelector<HTMLElement>( '.mw-headline' );
		const headlineDirectText = Array.from( headlineElement?.childNodes ?? [] )
			.filter( n => n.nodeType === Node.TEXT_NODE )
			.reduce( ( acc, n ) => acc + n.textContent, '' )
			.trim();
		return headlineDirectText || headlineElement?.innerText;
	} catch ( e ) {
		console.error( 'Error getting section name', e, element );
		throw e;
	}
}
