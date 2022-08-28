import CopyrightProblemsPage from './CopyrightProblemsPage';
import CopyrightProblemsListing from './CopyrightProblemsListing';
import ListingActionLink from '../ui/ListingActionLink';

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
	/** Cached wikitext. Based off of the revision ID. */
	wikitext: string;

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
	 * @inheritDoc
	 */
	async getWikitext(): Promise<string> {
		return this.wikitext ?? ( this.wikitext = await super.getWikitext() );
	}

	/**
	 * @return all copyright problem listings on the page.
	 */
	getListings(): CopyrightProblemsListing[] {
		const links: HTMLElement[] = [];
		/**
		 * Avoids collisions by assigning an `i` number when a page appears as a listing twice.
		 */
		const pageSet: Record<string, number> = {};

		this.document.querySelectorAll(
			'#mw-content-text .mw-parser-output a:not(.external)'
		).forEach( ( link: HTMLElement ) => {
			if ( this.listingMap.has( link ) ) {
				links.push( link );
				return;
			}

			const listingData = CopyrightProblemsListing.getListing( link ) ||
				CopyrightProblemsListing.getBasicListing( link );

			if ( listingData ) {
				const prefixedDb = listingData.title.getPrefixedDb();
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

}
