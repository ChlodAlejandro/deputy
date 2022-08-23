/**
 * A class that represents a `Wikipedia:Copyright problems` page, a page that lists
 * a collection of accumulated copyright problems found on Wikipedia. Users who are
 * not well-versed in copyright can submit listings there to be reviewed by more-
 * knowledgeable editors.
 *
 * This page runs on:
 * - The main `Wikipedia:Copyright problems` page
 * - `Wikipedia:Copyright problems` subpages (which may/may not be date-specific entries)
 */
import normalizeTitle from '../../../util/normalizeTitle';
import CopyrightProblemsListing from './CopyrightProblemsListing';

/**
 *
 */
export default class CopyrightProblemsPage {

	static rootPage = new mw.Title(
		'Wikipedia:Copyright problems/'
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
	/** Whether this is the main page or not */
	main: boolean;
	/** The document to use for reading operations */
	document: Document;

	listingMap: Map<HTMLElement, CopyrightProblemsListing>;

	/**
	 *
	 * @param listingPage
	 * @param document
	 */
	constructor( listingPage: mw.Title, document = window.document ) {
		this.title = listingPage;
		this.document = document;
	}

	/**
	 * @return all copyright problem listings on the page.
	 */
	getListings(): CopyrightProblemsListing[] {
		const links: HTMLElement[] = [];
		this.document.querySelectorAll(
			'.mw-content-text .mw-parser-output a:not(.external)'
		).forEach( ( link: HTMLElement ) => {
			if ( this.listingMap.has( link ) ) {
				links.push( link );
				return;
			}

			const listingData = CopyrightProblemsListing.getListing( link ) ||
				CopyrightProblemsListing.getBasicListing( link );
			if ( listingData ) {
				this.listingMap.set( link, new CopyrightProblemsListing( this, listingData ) );
				links.push( link );
			}
		} );

		return links.map( ( link: HTMLElement ) => this.listingMap.get( link ) );
	}

}
