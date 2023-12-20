/**
 * Removes an element from its document.
 *
 * @param element
 * @return The removed element
 */
export default function <T extends Node>( element: T ): T {
	return element?.parentElement?.removeChild( element );
}
