/**
 * Unwraps an OOUI widget from its JQuery `$element` variable and returns it as an
 * HTML element.
 *
 * @param el The widget to unwrap.
 */
export default function ( el: any ): HTMLElement {
	return el.$element[ 0 ];
}
