/**
 * Handles Deputy case pages, controls UI features, among other things.
 */
export default class DeputyCasePage {

	static rootPage = new mw.Title(
		'User:Chlod (test)/sandbox/Contributor copyright investigations'
	);

	/**
	 * Normalizes the title into an mw.Title object based on either a given title or
	 * the current page.
	 *
	 * @param title The title to normalize. Default is current page.
	 * @return {mw.Title} A mw.Title object.
	 * @private
	 */
	private static normalizeTitle( title?: string | mw.Title ): mw.Title {
		if ( title instanceof mw.Title ) {
			return title;
		} else if ( typeof title === 'string' ) {
			return new mw.Title( title );
		} else if ( !title ) {
			return new mw.Title( mw.config.get( 'wgPageName' ) );
		} else {
			return null;
		}
	}

	/**
	 * Checks if the current page (or a supplied page) is a case page (subpage of
	 * the root page).
	 *
	 * @param title The title of the page to check.
	 * @return `true` if the page is a case page.
	 */
	static isCasePage( title?: string | mw.Title ): boolean {
		return this.normalizeTitle( title ).getPrefixedDb()
			.startsWith( this.rootPage.getPrefixedDb() + '/' );
	}

	/**
	 * Gets the case name by parsing the title.
	 *
	 * @param title The title of the case page
	 * @return The case name, or `null` if the title was not a valid case page
	 */
	static getCaseName?( title?: string | mw.Title ): string {
		title = this.normalizeTitle( title );
		if ( !this.isCasePage( title ) ) {
			return null;
		}

	}

}
