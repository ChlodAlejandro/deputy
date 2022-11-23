/**
 * @param element The element to get the name of
 * @return the name of a section from its section heading.
 */
export default function sectionHeadingName( element: HTMLHeadingElement ): string {
	try {
		return element.querySelector<HTMLElement>( '.mw-headline' )?.innerText ??
			element.innerText;
	} catch ( e ) {
		console.error( 'Error getting section name', e, element );
		throw e;
	}
}
