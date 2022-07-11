/**
 * Swaps two elements in the DOM. Element 1 will be removed from the DOM, Element 2 will
 * be added in its place.
 *
 * @param element1 The element to remove
 * @param element2 The element to insert
 * @return `element2`, for chaining
 */
export default function <T extends Element> ( element1: T, element2: T ): T {
	try {
		element1.insertAdjacentElement( 'afterend', element2 );
		element1.parentElement.removeChild( element1 );
		return element2;
	} catch ( e ) {
		console.error( e, { element1, element2 } );
		// Caught for debug only. Rethrow.
		throw e;
	}
}
