import normalizeTitle from '../../../wiki/util/normalizeTitle';
import getPageContent from '../../../wiki/util/getPageContent';
import decorateEditSummary from '../../../wiki/util/decorateEditSummary';
import MwApi from '../../../MwApi';

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

	static readonly pageCache = new Map<string, CopyrightProblemsPage>();

	/** The title of the listing page */
	title: mw.Title;
	/** The current revision ID of the listing page. Helps in avoiding edit conflicts. */
	revid: number;
	/** Whether this is the main page or not */
	main: boolean;

	/** Cached wikitext. Based off of the revision ID. */
	wikitext: string;

	/**
	 * Gets a listing page from the cache, if available. If a cached page is not available,
	 * it will be created for you.
	 *
	 * @param listingPage
	 * @param revid
	 * @return The page requested
	 */
	static get( listingPage: mw.Title, revid?: number ): CopyrightProblemsPage {
		const key = listingPage.getPrefixedDb() + '##' + ( revid ?? 0 );

		if ( CopyrightProblemsPage.pageCache.has( key ) ) {
			return CopyrightProblemsPage.pageCache.get( key );
		} else {
			const page = new CopyrightProblemsPage( listingPage, revid );
			CopyrightProblemsPage.pageCache.set( key, page );
			return page;
		}
	}

	/**
	 * Private constructor. Use `get` instead to avoid cache misses.
	 *
	 * @param listingPage
	 * @param revid
	 */
	protected constructor( listingPage: mw.Title, revid?: number ) {
		this.title = listingPage;
		this.main = CopyrightProblemsPage.rootPage.getPrefixedText() ===
			listingPage.getPrefixedText();
		this.revid = revid;
	}

	/**
	 * @return the current wikitext of the page
	 */
	async getWikitext(): Promise<string> {
		if ( this.wikitext ) {
			return this.wikitext;
		}

		const content = await getPageContent( this.title );
		this.revid = content.revid;
		this.wikitext = content;
		return content;
	}

	/**
	 * Posts a single page listing to this page, or (if on the root page), the page for
	 * the current date. Listings are posted in the following format:
	 * ```
	 * * {{subst:article-cv|Example}} <comment> ~~~~
	 * ```
	 *
	 * For posting multiple pages, use `postListings`.
	 *
	 * @param page
	 * @param comments
	 */
	async postListing( page: mw.Title, comments?: string ): Promise<void> {
		const listingPage = this.main ? CopyrightProblemsPage.getCurrentListingPage() : this.title;
		await MwApi.action.postWithEditToken( {
			action: 'edit',
			title: listingPage.getPrefixedText(),
			appendtext: `\n* {{subst:article-cv|1=${
				page.getPrefixedText()
			}}}${
				comments ? ' ' + comments : ''
			} ~~~~`,
			// TODO: l10n
			summary: decorateEditSummary(
				`Adding listing for [[${
					listingPage.getPrefixedText()
				}#${
					page.getPrefixedText()
				}|${
					page.getPrefixedText()
				}]]`
			)
		} );
	}

	/**
	 * Posts multiple pages under a collective listing. Used for cases where the same
	 * comment can be applied to a set of pages. Listings are posted in the following
	 * format:
	 * ```
	 * ;{{anchor|1=<title>}}<title>
	 * * {{subst:article-cv|1=Page 1}}
	 * * {{subst:article-cv|1=Page 2}}
	 * <comment> ~~~~
	 * ```
	 *
	 * @param page
	 * @param title
	 * @param comments
	 */
	async postListings( page: mw.Title[], title: string, comments?: string ): Promise<void> {
		const listingPage = this.main ? CopyrightProblemsPage.getCurrentListingPage() : this.title;
		await MwApi.action.postWithEditToken( {
			action: 'edit',
			title: listingPage.getPrefixedText(),
			appendtext: `\n;{{anchor|1=${
				title
			}}}${
				title
			}\n${
				page.map( ( p ) => `* {{subst:article-cv|1=${p.getPrefixedText()}}}` ).join( '\n' )
			}\n${
				comments ?? ''
			} ~~~~`,
			// TODO: l10n
			summary: decorateEditSummary(
				`Adding a batch listing for "[[${
					listingPage.getPrefixedText()
				}#${
					title
				}|${
					title
				}]]"`
			)
		} );
	}

}
