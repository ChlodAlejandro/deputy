/**
 *
 * @param element
 */
export default function findNextSiblingElement( element: Node ): Element | null {
	if ( element == null ) {
		return null;
	}

	let anchor = element.nextSibling;
	while ( anchor && !( anchor instanceof Element ) ) {
		anchor = anchor.nextSibling;
	}
	return anchor as Element;
}
