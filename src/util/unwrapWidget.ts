/**
 * Unwraps an OOUI widget from its JQuery `$element` variable and returns it as an
 * HTML element.
 *
 * @param el The widget to unwrap.
 * @return The unwrapped widget.
 */
export default function ( el: any ): HTMLElement {
	if ( el.$element == null ) {
		console.error( el );
		throw new Error( 'Element is not a OOUI Widget!' );
	}
	return el.$element[ 0 ];
}
