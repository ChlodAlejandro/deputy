import normalizeTitle from '../../../util/normalizeTitle';
import getPageContent from '../../../util/getPageContent';

/**
 * A class that represents a `Wikipedia:Copyright problems` page, a page that lists
 * a collection of accumulated copyright problems found on Wikipedia. Users who are
 * not well-versed in copyright can submit listings there to be reviewed by more-
 * knowledgeable editors.
 *
 * This page can refer to any Copyright problems page, and not necessarily one that
 * is running on the current tab. For that, CopyrightProblemsSession is used.
 */
export default class CopyrightProblemsPage {

	static rootPage = new mw.Title(
		'Wikipedia:Copyright problems'
	);

	/**
	 * Gets the date to use for the current listing.
	 * TODO: Check if this is i18n-safe
	 *
	 * @param header
	 * @return The current date as a string
	 */
	static getCurrentListingDate( header = false ): string {
		const style = {
			// TODO: l10n
			header: 'dmy',
			page: 'ymd'
		}[ header ? 'header' : 'page' ];
		const now = new Date();
		const locale = mw.config.get( 'wgContentLanguage' );
		return `${now.toLocaleString( locale, {
			[ style === 'ymd' ? 'year' : 'day' ]: 'numeric'
		} )} ${now.toLocaleString( locale, {
			month: 'long'
		} )} ${now.toLocaleString( locale, {
			[ style === 'ymd' ? 'day' : 'year' ]: 'numeric'
		} )}`;
	}

	/**
	 * @return The title of the current copyright problems subpage.
	 */
	static getCurrentListingPage(): mw.Title {
		return new mw.Title( this.rootPage.getPrefixedText() + this.getCurrentListingDate() );
	}

	/**
	 * @param title The title to check
	 * @return `true` if the given page is a valid listing page.
	 */
	static isListingPage( title = mw.config.get( 'wgPageName' ) ): boolean {
		return normalizeTitle( title )
			.getPrefixedText()
			.startsWith( this.rootPage.getPrefixedText() );
	}

	/**
	 * Gets the current CopyrightProblemsPage (on Copyright Problems listing pages)
	 *
	 * @return A CopyrightProblemsPage for the current page.
	 */
	static getCurrent(): CopyrightProblemsPage {
		const listingPage = this.getCurrentListingPage();
		return new CopyrightProblemsPage( listingPage );
	}

	/** The title of the listing page */
	title: mw.Title;
	/** The current revision ID of the listing page. Helps in avoiding edit conflicts. */
	revid: number;
	/** Whether this is the main page or not */
	main: boolean;

	/**
	 *
	 * @param listingPage
	 * @param revid
	 */
	constructor( listingPage: mw.Title, revid?: number ) {
		this.title = listingPage;
		this.main = CopyrightProblemsPage.rootPage.getPrefixedText() ===
			listingPage.getPrefixedText();
		this.revid = revid;

	}

	/**
	 * @return the current wikitext of the page
	 */
	async getWikitext(): Promise<string> {
		return getPageContent( this.title );
	}

}
