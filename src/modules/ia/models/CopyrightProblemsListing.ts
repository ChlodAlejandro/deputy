import type CopyrightProblemsPage from './CopyrightProblemsPage';

interface FullCopyrightProblemsListingData {
	basic: false;
	i?: number;
	title: mw.Title;
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

			return {
				basic: false,
				title,
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
			let title: mw.Title;
			const href = el.getAttribute( 'href' );
			const articlePathRegex = new RegExp( mw.util.getUrl( '(.*)' ) );
			if ( articlePathRegex.test( href ) ) {
				// The page exists and matches the article path (`/wiki/$1`) RegExp.
				title = new mw.Title( articlePathRegex.exec( href )[ 1 ] );
			} else if ( href.startsWith( mw.util.wikiScript( 'index' ) ) ) {
				// The page does not exist but it matches the script path (`/w/index.php`).
				// Attempt to extract page title from `title` parameter.
				const titleRegex = /[?&]title=(.*?)(?:&|$)/;
				if ( titleRegex.test( href ) ) {
					title = new mw.Title( titleRegex.exec( href )[ 1 ] );
				} else {
					// Not a valid link.
					return false;
				}
			} else {
				// Not a valid link.
				return false;
			}

			return {
				basic: true,
				title,
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
	 * @param listingPage The page that this listing is on. This is not necessarily the page that
	 *                    the listing's wikitext is on, nor is it necessarily the root page.
	 * @param data Additional data about the page
	 * @param i A discriminator used to avoid collisions when a page is listed multiple times.
	 */
	constructor(
		listingPage: CopyrightProblemsPage,
		data: CopyrightProblemsListingData,
		i = 1
	) {
		this.listingPage = listingPage;
		this.i = Math.max( 1, i ); // Ensures no value below 1.

		this.basic = data.basic;
		this.title = data.title;
		this.element = data.element;
		if ( data.basic === false ) {
			this.anchor = data.anchor;
			this.plainlinks = data.plainlinks;
		}
	}

}
