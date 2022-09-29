import CopyrightProblemsPage from './CopyrightProblemsPage';
import CopyrightProblemsListing from './CopyrightProblemsListing';
import ListingActionLink from '../ui/ListingActionLink';
import equalTitle from '../../../util/equalTitle';
import swapElements from '../../../util/swapElements';
import NewCopyrightProblemsListing from '../ui/NewCopyrightProblemsListing';

/**
 * A CopyrightProblemsPage that represents a page that currently exists on a document.
 * This document must be a MediaWiki page, and does not accept Parsoid-based documents
 * (due to the lack of `mw.config`), used to get canonical data about the current page.
 *
 * To ensure that only an active document (either a current tab or a document within an
 * IFrame) can be used, the constructor only takes in a `Document`.
 *
 * This class runs on:
 * - The main `Wikipedia:Copyright problems` page
 * - `Wikipedia:Copyright problems` subpages (which may/may not be date-specific entries)
 */
export default class CopyrightProblemsSession extends CopyrightProblemsPage {

	/** The document to use for reading operations */
	document: Document;

	listingMap: Map<HTMLElement, CopyrightProblemsListing> = new Map();

	/**
	 *
	 * @param document
	 */
	constructor( document: Document = window.document ) {
		const title = new mw.Title( document.defaultView.mw.config.get( 'wgPageName' ) );
		const revid = +document.defaultView.mw.config.get( 'wgCurRevisionId' );

		super( title, revid );

		this.document = document;
	}

	/**
	 * @param root
	 * @return all copyright problem listings on the page.
	 */
	getListings( root: ParentNode = this.document ): CopyrightProblemsListing[] {
		const links: HTMLElement[] = [];
		/**
		 * Avoids collisions by assigning an `i` number when a page appears as a listing twice.
		 */
		const headingSets: Record<string, Record<string, number>> = {};

		root.querySelectorAll(
			'#mw-content-text .mw-parser-output a:not(.external)'
		).forEach( ( link: HTMLElement ) => {
			if ( this.listingMap.has( link ) ) {
				links.push( link );
				return;
			}

			const listingData = CopyrightProblemsListing.getListing( link ) ||
				CopyrightProblemsListing.getBasicListing( link );

			if ( listingData ) {
				const listingPageTitle = listingData.listingPage.getPrefixedDb();
				if ( headingSets[ listingPageTitle ] == null ) {
					headingSets[ listingPageTitle ] = {};
				}

				const prefixedDb = listingData.title.getPrefixedDb();
				const pageSet = headingSets[ listingPageTitle ];
				if ( pageSet[ prefixedDb ] != null ) {
					pageSet[ prefixedDb ]++;
				} else {
					pageSet[ prefixedDb ] = 1;
				}

				this.listingMap.set( link, new CopyrightProblemsListing(
					listingData,
					this.main ? null : this,
					pageSet[ prefixedDb ]
				) );
				links.push( link );
			}
		} );

		return links.map( ( link: HTMLElement ) => this.listingMap.get( link ) );
	}

	/**
	 * Adds an action link to a copyright problem listing.
	 *
	 * @param listing
	 */
	addListingActionLink( listing: CopyrightProblemsListing ): void {
		const baseElement = listing.element.parentElement;
		let beforeChild;
		for ( const child of Array.from( baseElement.children ) ) {
			if ( [ 'OL', 'UL', 'DL' ].indexOf( child.tagName ) !== -1 ) {
				beforeChild = child;
				break;
			}
		}

		const link = ListingActionLink( this, listing );
		if ( beforeChild ) {
			beforeChild.insertAdjacentElement( 'beforebegin', link );
		} else {
			baseElement.appendChild( link );
		}
	}

	/**
	 *
	 */
	addNewListingsPanel(): void {
		document.querySelectorAll(
			'.mw-headline > a, a.external, a.redlink'
		).forEach( ( el ) => {
			const href = el.getAttribute( 'href' );
			const url = new URL( href, window.location.href );
			if (
				equalTitle(
					url.searchParams.get( 'title' ),
					CopyrightProblemsPage.getCurrentListingPage()
				) ||
				url.pathname === mw.util.getUrl(
					CopyrightProblemsPage.getCurrentListingPage().getPrefixedText()
				)
			) {
				// Crawl backwards, avoiding common inline elements, to see if this is a standalone
				// line within the rendered text.
				let currentPivot: Element = el.parentElement;

				while (
					currentPivot !== null &&
					[ 'I', 'B', 'SPAN', 'EM', 'STRONG' ].indexOf( currentPivot.tagName ) !== -1
				) {
					currentPivot = currentPivot.parentElement;
				}

				// By this point, current pivot will be a <div>, <p>, or other usable element.
				if (
					!el.parentElement.classList.contains( 'mw-headline' ) &&
					( currentPivot == null ||
						currentPivot.children.length > 1 )
				) {
					return;
				} else if ( el.parentElement.classList.contains( 'mw-headline' ) ) {
					// "Edit source" button of an existing section heading.
					let headingBottom = el.parentElement.parentElement.nextElementSibling;
					let pos: InsertPosition = 'beforebegin';
					while (
						headingBottom != null &&
						!/^H[123456]$/.test( headingBottom.tagName )
					) {
						headingBottom = headingBottom.nextElementSibling;
					}

					if ( headingBottom == null ) {
						headingBottom = el.parentElement.parentElement.parentElement;
						pos = 'beforeend';
					}

					// Add below today's section header.
					mw.loader.using( [
						'oojs-ui-core',
						'oojs-ui.styles.icons-interactions',
						'mediawiki.widgets',
						'mediawiki.widgets.TitlesMultiselectWidget'
					], () => {
						// H4
						headingBottom.insertAdjacentElement(
							pos,
							NewCopyrightProblemsListing()
						);
					} );
				} else {
					mw.loader.using( [
						'oojs-ui-core',
						'oojs-ui.styles.icons-interactions',
						'mediawiki.widgets',
						'mediawiki.widgets.TitlesMultiselectWidget'
					], () => {
						swapElements( el, NewCopyrightProblemsListing() );
					} );
				}
			}
		} );
	}

}
