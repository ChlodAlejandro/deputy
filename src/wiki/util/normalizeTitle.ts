export type TitleLike = string | mw.Title | { namespace: number, title: string };

/**
 * Normalizes the title into an mw.Title object based on either a given title or
 * the current page.
 *
 * @param title The title to normalize. Default is current page.
 * @return {mw.Title} A mw.Title object. `null` if not a valid title.
 * @private
 */
export default function normalizeTitle( title?: TitleLike ): mw.Title {
	if ( title instanceof mw.Title ) {
		return title;
	} else if ( typeof title === 'string' ) {
		return new mw.Title( title );
	} else if ( title == null ) {
		// Null check goes first to avoid accessing properties of `null`.
		return new mw.Title( mw.config.get( 'wgPageName' ) );
	} else if ( title.title != null && title.namespace != null ) {
		return new mw.Title( title.title, title.namespace );
	} else {
		return null;
	}
}
