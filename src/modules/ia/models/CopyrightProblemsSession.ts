import CopyrightProblemsPage from './CopyrightProblemsPage';
import CopyrightProblemsListing, {
	isFullCopyrightProblemsListing
} from './CopyrightProblemsListing';
import ListingActionLink from '../ui/ListingActionLink';
import equalTitle from '../../../util/equalTitle';
import swapElements from '../../../util/swapElements';
import NewCopyrightProblemsListing from '../ui/NewCopyrightProblemsListing';
import normalizeTitle from '../../../wiki/util/normalizeTitle';
import normalizeWikiHeading from '../../../wiki/util/normalizeWikiHeading';

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

				const id = normalizeTitle(
					isFullCopyrightProblemsListing( listingData ) ?
						listingData.id :
						listingData.title
				).getPrefixedDb();
				const pageSet = headingSets[ listingPageTitle ];
				if ( pageSet[ id ] != null ) {
					pageSet[ id ]++;
				} else {
					pageSet[ id ] = 1;
				}

				this.listingMap.set( link, new CopyrightProblemsListing(
					listingData,
					this.main ? null : this,
					pageSet[ id ]
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
	 * Adds a panel containing the "new listing" buttons (single and multiple)
	 * and the panel container (when filing a multiple-page listing) to the proper
	 * location: either at the end of the copyright problems section or replacing
	 * the redlink to the blank copyright problems page.
	 */
	addNewListingsPanel(): void {
		document.querySelectorAll(
			'.mw-headline a, .mw-heading a, a.external, a.redlink'
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
				if ( el.classList.contains( 'external' ) || el.classList.contains( 'redlink' ) ) {
					// Keep crawling up and find the parent of this element that is directly
					// below the parser root or the current section.
					let currentPivot = el;
					while (
						currentPivot != null &&
						!currentPivot.classList.contains( 'mw-parser-output' ) &&
						[ 'A', 'I', 'B', 'SPAN', 'EM', 'STRONG' ]
							.indexOf( currentPivot.tagName ) !== -1
					) {
						currentPivot = currentPivot.parentElement;
					}

					// We're now at the <p> or <div> or whatever.
					// Check if it only has one child (the tree that contains this element)
					// and if so, replace the links.

					if ( currentPivot.children.length > 1 ) {
						return;
					}

					mw.loader.using( [
						'oojs-ui-core',
						'oojs-ui.styles.icons-interactions',
						'mediawiki.widgets',
						'mediawiki.widgets.TitlesMultiselectWidget'
					], () => {
						swapElements( currentPivot, NewCopyrightProblemsListing() );
					} );
				} else {
					// This is in a heading. Let's place it after the section heading.
					const heading = normalizeWikiHeading( el );

					if ( heading.root.classList.contains( 'dp-ia-upgraded' ) ) {
						return;
					}
					heading.root.classList.add( 'dp-ia-upgraded' );

					mw.loader.using( [
						'oojs-ui-core',
						'oojs-ui.styles.icons-interactions',
						'mediawiki.widgets',
						'mediawiki.widgets.TitlesMultiselectWidget'
					], () => {
						heading.root.insertAdjacentElement(
							'afterend',
							NewCopyrightProblemsListing()
						);
					} );
				}
			}
		} );
	}

}
