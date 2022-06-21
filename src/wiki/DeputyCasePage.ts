import normalizeTitle from '../util/normalizeTitle';

/**
 * Handles Deputy case pages, controls UI features, among other things.
 */
export default class DeputyCasePage {

	static rootPage = new mw.Title(
		// TODO: Change to actual production value.
		'User:Chlod (test)/sandbox/Contributor copyright investigations'
	);

	/**
	 * Checks if the current page (or a supplied page) is a case page (subpage of
	 * the root page).
	 *
	 * @param title The title of the page to check.
	 * @return `true` if the page is a case page.
	 */
	static isCasePage( title?: string | mw.Title ): boolean {
		return normalizeTitle( title ).getPrefixedDb()
			.startsWith( this.rootPage.getPrefixedDb() + '/' );
	}

	/**
	 * Gets the case name by parsing the title.
	 *
	 * @param title The title of the case page
	 * @return The case name, or `null` if the title was not a valid case page
	 */
	static getCaseName?( title?: string | mw.Title ): string {
		title = normalizeTitle( title );
		if ( !this.isCasePage( title ) ) {
			return null;
		} else {
			return title.getPrefixedText().replace(
				this.rootPage.getPrefixedText() + '/', ''
			);
		}
	}

}
