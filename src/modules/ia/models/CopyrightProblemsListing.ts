import CopyrightProblemsPage from './CopyrightProblemsPage';
import cloneRegex from '../../../util/cloneRegex';
import normalizeTitle from '../../../wiki/util/normalizeTitle';
import anchorToTitle from '../../../wiki/util/anchorToTitle';

interface FullCopyrightProblemsListingData {
	basic: false;
	i?: number;
	title: mw.Title;
	listingPage: mw.Title;
	element: HTMLAnchorElement;
	anchor: HTMLSpanElement;
	plainlinks: HTMLSpanElement;
}

interface BasicCopyrightProblemsListingData {
	/**
	 * Whether the listing is basic or not. When listings are detected from the basic
	 * method, they are more likely to cause bugs or unintended output.
	 */
	basic: true;
	/**
	 * If multiple listings exist with the same page name, `i` will ensure that the
	 * correct one is found and edited.
	 */
	i?: number;
	title: mw.Title;
	listingPage: mw.Title;
	element: HTMLAnchorElement;
}

type CopyrightProblemsListingData =
	| FullCopyrightProblemsListingData
	| BasicCopyrightProblemsListingData;

/**
 * Represents an <b>existing</b> copyright problems listing. To add or create new
 * listings, use the associated functions in {@link CopyrightProblemsPage}.
 */
export default class CopyrightProblemsListing {

	// TODO: l10n
	static articleCvRegex = /^(\*\s*)?(?:\{\{anchor\|(.+)}}\[\[\2]]|\[\[([^|]*?)]])/g;

	/**
	 * Gets the page title of the listing page. This is used in `getListing` and
	 * `getBasicListing` to identify which page the listings are on.
	 *
	 * This makes the assumption that all listings have a prior H4 header that
	 * links to the proper listing page. If that assumption is not met, this
	 * returns `null`.
	 *
	 * @param el
	 * @return The page title, or `false` if none was found.
	 * @private
	 */
	private static getListingHeader( el: HTMLElement ): mw.Title | false {
		let listingPage: mw.Title | false = null;
		let previousPivot = (
			// Target the ol/ul element itself if a list, target the <p> if not a list.
			el.parentElement.tagName === 'LI' ? el.parentElement.parentElement : el.parentElement
		).previousElementSibling;

		while ( previousPivot != null && previousPivot.tagName !== 'H4' ) {
			previousPivot = previousPivot.previousElementSibling;
		}

		if ( previousPivot == null ) {
			return false;
		}

		if ( previousPivot.querySelector( '.mw-headline' ) != null ) {
			// At this point, previousPivot is likely a MediaWiki level 4 heading.
			const h4Anchor = previousPivot.querySelector( '.mw-headline a' );
			listingPage = anchorToTitle( h4Anchor as HTMLAnchorElement );

			// Identify if the page is a proper listing page (within the root page's
			// pagespace)
			if (
				!listingPage ||
				!listingPage.getPrefixedText()
					.startsWith( CopyrightProblemsPage.rootPage.getPrefixedText() )
			) {
				return false;
			}
		}
		return listingPage ?? false;
	}

	/**
	 * Determines if a given element is a valid anchor element (`<a>`) which
	 * makes up a "listing" (a page for checking on the Copyright Problems page).
	 *
	 * Detection is based on the {{article-cv}} template. Changes to the template
	 * must be reflected here, with backwards compatibility for older listings.
	 * The {{anchor}} is not the tracked element here, since it remains invisible
	 * to the user.
	 *
	 * @param el
	 * @return Data related to the listing, for use in instantiation; `false` if not a listing.
	 */
	static getListing( el: HTMLElement ): CopyrightProblemsListingData | false {
		try {
			if ( el.tagName !== 'A' || el.getAttribute( 'href' ) === null ) {
				// Not a valid anchor element.
				return false;
			}

			// Check for {{anchor}} before the link.
			const anchor = el.previousElementSibling;
			if ( anchor == null || anchor.tagName !== 'SPAN' ) {
				return false;
			}

			// Get the page title based on the anchor, verified by the link.
			// This ensures we're always using the prefixedDb version of the title (as
			// provided by the anchor) for stability.
			let title: mw.Title;
			const prefixedDb = anchor.getAttribute( 'id' );
			const href = el.getAttribute( 'href' );
			if ( prefixedDb == null ) {
				// Not an anchor.
				return false;
			} else if ( href === mw.util.getUrl( prefixedDb ) ) {
				// The page exists and links to the correct page.
				title = new mw.Title( prefixedDb );
			} else if ( new RegExp(
				`[?&]title=${mw.util.escapeRegExp( prefixedDb )}(?:&|$)`
			).test( prefixedDb ) ) {
				// The page does not exist but it links to the correct page.
				title = new mw.Title( prefixedDb );
			} else {
				// The page does not link to the correct page.
				return false;
			}

			// Checks for the <span class="plainlinks"> element.
			// This ensures that the listing came from {{article-cv}} and isn't just a
			// link with an anchor.
			const plainlinks = el.nextElementSibling;
			if (
				plainlinks == null ||
				( plainlinks.tagName !== 'SPAN' && !plainlinks.classList.contains( 'plainlinks' ) )
			) {
				return false;
			}

			// Attempts to look for a prior <h4> tag. Used for determining the listing, if on a
			// root page.
			const listingPage = this.getListingHeader( el );
			if ( !listingPage ) {
				// Can't find a proper listing page for this. In some cases, this
				// should be fine, however we don't want the [respond] button to
				// appear if we don't know where a page is actually listed.
				return false;
			}

			return {
				basic: false,
				title,
				listingPage,
				element: el as HTMLAnchorElement,
				anchor: anchor as HTMLSpanElement,
				plainlinks: plainlinks as HTMLSpanElement
			};
		} catch ( e ) {
			console.error( "Couldn't parse listing. Might be malformed?", e, el );
			return false;
		}
	}

	/**
	 * A much more loose version of {@link getListing}, which only checks if a given
	 * page is a link at the start of a paragraph or `<[uo]l>` list. Metadata is
	 * unavailable with this method.
	 *
	 * @param el
	 * @return Data related to the listing, for use in instantiation; `false` if not a listing.
	 */
	static getBasicListing( el: HTMLElement ): CopyrightProblemsListingData | false {
		try {
			if ( el.tagName !== 'A' || el.getAttribute( 'href' ) == null ) {
				// Not a valid anchor element.
				return false;
			}

			// Check if this is the first node in the container element.
			if ( el.previousSibling != null ) {
				return false;
			}

			// Check if the container is a paragraph or a top-level ul/ol list item.
			if (
				el.parentElement.tagName !== 'P' &&
				( el.parentElement.tagName !== 'LI' && (
					el.parentElement.parentElement.tagName !== 'UL' &&
					el.parentElement.parentElement.tagName !== 'OL'
				) )
			) {
				return false;
			}

			// Attempt to extract page title.
			const title = anchorToTitle( el as HTMLAnchorElement );
			if ( !title ) {
				return false;
			}

			// Attempts to look for a prior <h4> tag. Used for determining the listing, if on a
			// root page.
			const listingPage = this.getListingHeader( el );
			if ( !listingPage ) {
				// Can't find a proper listing page for this. In some cases, this
				// should be fine, however we don't want the [respond] button to
				// appear if we don't know where a page is actually listed.
				return false;
			}

			return {
				basic: true,
				title,
				listingPage,
				element: el as HTMLAnchorElement
			};
		} catch ( e ) {
			console.error( "Couldn't parse listing. Might be malformed?", e, el );
			return false;
		}
	}

	/**
	 * The listing page that this listing belongs to.
	 */
	listingPage: CopyrightProblemsPage;

	i: number;
	basic: boolean;
	title: mw.Title;
	element: HTMLAnchorElement;
	anchor: HTMLSpanElement;
	plainlinks: HTMLSpanElement;

	/**
	 * @return an ID representation of this listing. Helps in finding it inside of
	 * wikitext.
	 */
	get id(): string {
		return this.title.getPrefixedDb() + ( this.i > 1 ? `-${this.i}` : '' );
	}

	/**
	 * Creates a new listing object.
	 *
	 * @param data Additional data about the page
	 * @param listingPage The page that this listing is on. This is not necessarily the page that
	 *                    the listing's wikitext is on, nor is it necessarily the root page.
	 * @param i A discriminator used to avoid collisions when a page is listed multiple times.
	 */
	constructor(
		data: CopyrightProblemsListingData,
		listingPage?: CopyrightProblemsPage,
		i = 1
	) {
		this.listingPage = listingPage ?? CopyrightProblemsPage.get( data.listingPage );
		this.i = Math.max( 1, i ); // Ensures no value below 1.

		this.basic = data.basic;
		this.title = data.title;
		this.element = data.element;
		if ( data.basic === false ) {
			this.anchor = data.anchor;
			this.plainlinks = data.plainlinks;
		}
	}
	/**
	 * Gets the line number of a listing based on the page's wikitext.
	 * This is further used when attempting to insert comments to listings.
	 *
	 * This provides an object with `start` and `end` keys. The `start` denotes
	 * the line on which the listing appears, the `end` denotes the last line
	 * where there is a comment on that specific listing.
	 *
	 * @return See documentation body.
	 */
	async getListingWikitextLines(): Promise<{ start: number, end: number }> {
		const lines = ( await this.listingPage.getWikitext() ).split( '\n' );

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
					return { start: startLine, end: endLine ?? startLine };
				} else {
					endLine = line;
				}
			} else {
				const match = cloneRegex( CopyrightProblemsListing.articleCvRegex )
					.exec( lineText );

				if ( match != null ) {
					// Check if this is the page we're looking for.
					if (
						normalizeTitle( match[ 2 ] || match[ 3 ] ).getPrefixedText() !==
						this.title.getPrefixedText()
					) {
						continue;
					}

					// Check if this should be skipped.
					if ( skipCounter < this.i ) {
						// Skip if we haven't skipped enough.
						skipCounter++;
						continue;
					}

					bulletList = /[*:]/.test( ( match[ 1 ] || '' ).trim() );
					startLine = line;
				}
			}
		}

		if ( startLine === lines.length - 1 ) {
			// Last line only.
			return { start: startLine, end: startLine };
		}

		// Couldn't find an ending. Malformed listing?
		// Gracefully handle this.
		throw new Error( 'Listing is missing from wikitext or malformed listing' );
	}

}
