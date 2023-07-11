/**
 * Unwraps an element into its child elements. This entirely discards
 * the parent element.
 *
 * @param el The element to unwrap.
 * @return The unwrapped element.
 */
export default function ( el: HTMLElement ): ( HTMLElement | string )[] {
	return Array.from( el.childNodes ).map( v =>
		v instanceof HTMLElement ? v :
			( v instanceof Text ? v.textContent : undefined )
	).filter( v => v !== undefined );
}
