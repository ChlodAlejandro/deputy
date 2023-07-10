/**
 * Unwraps an element into its child elements. This entirely discards
 * the parent element.
 *
 * @param el The element to unwrap.
 * @return The unwrapped element.
 */
export default function ( el: HTMLElement ): HTMLElement[] {
	return Array.from( el.children ) as HTMLElement[];
}
