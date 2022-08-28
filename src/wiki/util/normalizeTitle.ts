/**
 * Normalizes the title into an mw.Title object based on either a given title or
 * the current page.
 *
 * @param title The title to normalize. Default is current page.
 * @return {mw.Title} A mw.Title object.
 * @private
 */
export default function normalizeTitle( title?: string | mw.Title ): mw.Title {
	if ( title instanceof mw.Title ) {
		return title;
	} else if ( typeof title === 'string' ) {
		return new mw.Title( title );
	} else if ( title == null ) {
		return new mw.Title( mw.config.get( 'wgPageName' ) );
	} else {
		return null;
	}
}
