/**
 * Swaps two elements in the DOM. Element 1 will be removed from the DOM, Element 2 will
 * be added in its place.
 *
 * @param element1 The element to remove
 * @param element2 The element to insert
 * @return `element2`, for chaining
 */
export default function ( element1: HTMLElement, element2: HTMLElement ): HTMLElement {
	element1.insertAdjacentElement( 'afterend', element2 );
	element1.parentElement.removeChild( element1 );
	return element2;
}
