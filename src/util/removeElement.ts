/**
 * Removes an element from its document.
 *
 * @param element
 * @return The removed element
 */
export default function ( element: HTMLElement ): HTMLElement {
	return element?.parentElement?.removeChild( element );
}
