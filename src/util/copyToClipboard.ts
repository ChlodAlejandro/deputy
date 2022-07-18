/**
 * Copies text to the clipboard. Relies on the old style of clipboard copying
 * (using `document.execCommand` due to a lack of support for `navigator`-based
 * clipboard handling).
 *
 * @param text The text to copy to the clipboard.
 */
export default function ( text: string ): void {
	const body = document.getElementsByTagName( 'body' )[ 0 ];
	const textarea = document.createElement( 'textarea' );
	textarea.value = text;
	textarea.style.position = 'fixed';
	textarea.style.left = '-100vw';
	textarea.style.top = '-100vh';
	body.appendChild( textarea );
	textarea.select();
	// noinspection JSDeprecatedSymbols
	document.execCommand( 'copy' );
	body.removeChild( textarea );
}
