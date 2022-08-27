import CopyrightProblemsPage from './CopyrightProblemsPage';
import CopyrightProblemsListing from './CopyrightProblemsListing';
import ListingActionLink from '../ui/ListingActionLink';
import cloneRegex from '../../../util/cloneRegex';
import normalizeTitle from '../../../util/normalizeTitle';

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
					this, listingData, pageSet[ prefixedDb ]
				) );
				links.push( link );
			}
		} );

		return links.map( ( link: HTMLElement ) => this.listingMap.get( link ) );
	}

	/**
	 * Gets the line number of a listing based on the page's wikitext.
	 * This is further used when attempting to insert comments to listings.
	 *
	 * This provides an object with `start` and `end` keys. The `start` denotes
	 * the line on which the listing appears, the `end` denotes the last line
	 * where there is a comment on that specific listing.
	 *
	 * @param listing A CopyrightProblemsListing
	 * @return See documentation body.
	 */
	async getListingWikitextLine(
		listing: CopyrightProblemsListing
	): Promise<{ start: number, end: number }> {
		const lines = ( await this.getWikitext() ).split( '\n' );

		let skipCounter = 1;
		let startLine = null;
		let endLine = null;
		let bulletList: boolean;
		for ( let line = 0; line < lines.length; line++ ) {
			const lineText = lines[ line ];

			// Check if this denotes the end of a listing.
			// Matches: `*:`, `**`
			// Does not match: `*`, ``, ` `
			if ( startLine != null ) {
				if ( bulletList ?
					!/^(\*[*:]+)/g.test( lineText ) :
					/^[^:*]/.test( lineText )
				) {
					return { start: startLine, end: endLine };
				} else {
					endLine = line;
				}
			} else {
				const match = cloneRegex( CopyrightProblemsSession.articleCvRegex )
					.exec( lineText );

				if ( match != null ) {
					// Check if this is the page we're looking for.
					if (
						normalizeTitle( match[ 2 ] || match[ 3 ] ).getPrefixedText() !==
						listing.title.getPrefixedText()
					) {
						continue;
					}

					// Check if this should be skipped.
					if ( skipCounter < listing.i ) {
						// Skip if we haven't skipped enough.
						skipCounter++;
						continue;
					}

					bulletList = /[*:]/.test( ( match[ 1 ] || '' ).trim() );
					startLine = line;
				}
			}
		}

		// Couldn't find an ending. Malformed listing?
		// Gracefully handle this.
		throw new Error( 'Listing is missing from wikitext or malformed listing' );
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
