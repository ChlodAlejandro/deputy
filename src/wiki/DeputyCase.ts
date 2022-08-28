import getPageTitle from './util/getPageTitle';
import normalizeTitle from './util/normalizeTitle';

/**
 * Base class for Deputy cases. Extended into {@link DeputyCasePage} to refer to an
 * active case page. Used to represent case pages in a more serializable way.
 */
export default class DeputyCase {

	static rootPage = new mw.Title(
		'Wikipedia:Contributor copyright investigations'
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

	/**
	 * The page ID of the case page.
	 */
	pageId: number;
	/**
	 * Title of the case page.
	 */
	title: mw.Title;

	/**
	 * Creats a Deputy case object.
	 *
	 * @param pageId The page ID of the case page.
	 * @param title The title of the case page.
	 */
	static async build( pageId: number, title?: mw.Title ): Promise<DeputyCase> {
		if ( title == null ) {
			title = await getPageTitle( pageId );
		}

		return new DeputyCase( pageId, title );
	}

	/**
	 * @param pageId The page ID of the case page.
	 * @param title The title of the case page.
	 */
	constructor( pageId: number, title: mw.Title ) {
		this.pageId = pageId;
		this.title = title;
	}

	/**
	 * Gets the case name by parsing the title.
	 *
	 * @return The case name, or `null` if the title was not a valid case page
	 */
	getCaseName(): string {
		return DeputyCase.getCaseName( this.title );
	}

}
