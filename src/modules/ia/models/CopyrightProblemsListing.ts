import CopyrightProblemsPage from './CopyrightProblemsPage';
import cloneRegex from '../../../util/cloneRegex';
import normalizeTitle from '../../../wiki/util/normalizeTitle';
import pagelinkToTitle from '../../../wiki/util/pagelinkToTitle';
import decorateEditSummary from '../../../wiki/util/decorateEditSummary';
import MwApi from '../../../MwApi';
import changeTag from '../../../config/changeTag';
import warn from '../../../util/warn';

export interface SerializedCopyrightProblemsListingData {
	basic: boolean;
	i?: number;
	id: string;
	title: { namespace: number, title: string, fragment: null | string };
	listingPage: { namespace: number, title: string, fragment: null | string };
	lines: { start: number, end: number };
}

/**
 * Represents a listing on a CPN page where the listing is substituted from
 * the `{{article-cv}}` template.
 */
interface FullCopyrightProblemsListingData {
	basic: false;
	i?: number;
	id: string;
	title: mw.Title;
	listingPage: mw.Title;
	element: HTMLAnchorElement;
	anchor: HTMLSpanElement;
	plainlinks: HTMLSpanElement;
}

/**
 * Represents a listing on a CPN page where the listing is just a page link.
 */
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
 * Check if a given copyright problems listing is full.
 *
 * @param data
 * @return `true` if the listing is a {@link FullCopyrightProblemsListingData}
 */
export function isFullCopyrightProblemsListing(
	data: CopyrightProblemsListingData
): data is FullCopyrightProblemsListingData {
	return data.basic === false;
}

/**
 * Represents an <b>existing</b> copyright problems listing. To add or create new
 * listings, use the associated functions in {@link CopyrightProblemsPage}.
 */
export default class CopyrightProblemsListing {

	/**
	 * Responsible for determining listings on a page. This method allows for full-metadata
	 * listing detection, and makes the process of detecting a given listing much more precise.
	 *
	 * This regular expression must catch three groups:
	 * - $1 - The initial `* `, used to keep the correct number of whitespace between parts.
	 * - $2 - The page title in the `id="..."`, ONLY IF the page is listed with an
	 *        `article-cv`-like template.
	 * - $3 - The page title in the wikilink, ONLY IF the page is listed with an
	 *        `article-cv`-like template.
	 * - $4 - The page title, ONLY IF the page is a bare link to another page and does not use
	 *        `article-cv`.
	 *
	 * @return A regular expression.
	 */
	static get articleCvRegex(): RegExp {
		// Acceptable level of danger; global configuration is found only in trusted
		// places (see WikiConfiguration documentation).
		// eslint-disable-next-line security/detect-non-literal-regexp
		return new RegExp( window.InfringementAssistant.wikiConfig.ia.listingWikitextMatch.get() );
	}

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
			listingPage = pagelinkToTitle( h4Anchor as HTMLAnchorElement );

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
	static getListing( el: HTMLElement ): FullCopyrightProblemsListingData | false {
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
			const id = anchor.getAttribute( 'id' );
			const title = pagelinkToTitle( el as HTMLAnchorElement );

			if ( title === false || id == null ) {
				// Not a valid link.
				return false;
			} else if ( title.getPrefixedText() !== new mw.Title( id ).getPrefixedText() ) {
				// Anchor and link mismatch. Someone tampered with the template?
				// In this case, rely on the link instead, as the anchor is merely invisible.
				warn(
					`Anchor and link mismatch for "${title.getPrefixedText()}".`, title, id
				);
			}

			// Checks for the <span class="plainlinks"> element.
			// This ensures that the listing came from {{article-cv}} and isn't just a
			// link with an anchor.
			const elSiblings = Array.from( el.parentElement.children );
			const elIndex = elSiblings.indexOf( el );
			const plainlinks = el.parentElement.querySelector(
				`:nth-child(${elIndex}) ~ span.plainlinks`
			);
			if (
				plainlinks == null ||
				// `~` never gets an earlier element, so just check if it's more than 2 elements
				// away.
				elSiblings.indexOf( plainlinks ) - elIndex > 2
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
				id,
				title,
				listingPage,
				element: el as HTMLAnchorElement,
				anchor: anchor as HTMLSpanElement,
				plainlinks: plainlinks as HTMLSpanElement
			};
		} catch ( e ) {
			warn( "Couldn't parse listing. Might be malformed?", e, el );
			return false;
		}
	}

	/**
	 * A much more loose version of {@link CopyrightProblemsListing#getListing},
	 * which only checks if a given page is a link at the start of a paragraph or
	 * `<[uo]l>` list. Metadata is unavailable with this method.
	 *
	 * @param el
	 * @return Data related to the listing, for use in instantiation; `false` if not a listing.
	 */
	static getBasicListing( el: HTMLElement ): BasicCopyrightProblemsListingData | false {
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
			const title = pagelinkToTitle( el as HTMLAnchorElement );
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
			warn( "Couldn't parse listing. Might be malformed?", e, el );
			return false;
		}
	}

	/**
	 * The listing page that this listing belongs to.
	 */
	listingPage: CopyrightProblemsPage;

	i: number;
	basic: boolean;
	id: string;
	title: mw.Title;
	element: HTMLAnchorElement;
	anchor: HTMLSpanElement;
	plainlinks: HTMLSpanElement;

	/**
	 * @return an ID representation of this listing. Helps in finding it inside of
	 * wikitext.
	 */
	get anchorId(): string {
		return this.id + ( this.i > 1 ? `-${this.i}` : '' );
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
			this.id = data.id;
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
	 * Use in conjunction with `listingPage.getWikitext()` to get the lines in wikitext.
	 *
	 * @return See documentation body.
	 */
	async getListingWikitextLines(): Promise<{ start: number, end: number }> {
		const lines = ( await this.listingPage.getWikitext() ).split( '\n' );

		let skipCounter = 1;
		let startLine = null;
		let endLine = null;
		let bulletList: boolean;
		const normalizedId = normalizeTitle( this.id ?? this.title ).getPrefixedText();
		const idMalformed = normalizedId !== this.title.getPrefixedText();
		for ( let line = 0; line < lines.length; line++ ) {
			const lineText = lines[ line ];

			// Check if this denotes the end of a listing.
			// Matches: `*:`, `**`
			// Does not match: `*`, ``, ` `
			if ( startLine != null ) {
				if ( bulletList ?
					!/^(\*[*:]+|:)/g.test( lineText ) :
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
					if (
						normalizeTitle( match[ 2 ] || match[ 4 ] ).getPrefixedText() !==
						normalizedId
					) {
						continue;
					}

					// Check if this should be skipped.
					if ( skipCounter < this.i ) {
						// Skip if we haven't skipped enough.
						skipCounter++;
						continue;
					}

					if ( idMalformed && match[ 2 ] === match[ 3 ] ) {
						throw new Error(
							`Expected malformed listing with ID "${
								normalizedId
							}" and title "${
								this.title.getPrefixedText()
							}" but got normal listing.`
						);
					}

					bulletList = /[*:]/.test( ( match[ 1 ] || '' ).trim() );
					startLine = line;
				}
			}
		}

		// We've reached the end of the document.
		// `startLine` is only ever set if the IDs match, so we can safely assume
		// that if `startLine` and `endLine` is set or if `startLine` is the last line
		// in the page, then we've found the listing (and it is the last listing on the
		// page, where `endLine` would have been set if it had comments).
		if (
			( startLine != null && endLine != null ) ||
			( startLine != null && startLine === lines.length - 1 )
		) {
			return { start: startLine, end: endLine ?? startLine };
		}

		// Couldn't find an ending. Malformed listing?
		// It should be nearly impossible to hit this condition.
		// Gracefully handle this.
		throw new Error( "Couldn't detect listing from wikitext (edit conflict/is it missing?)" );
	}

	/**
	 * Adds a comment to an existing listing.
	 *
	 * @param message
	 * @param indent
	 * @return the modified page wikitext.
	 */
	async addComment( message: string, indent = false ): Promise<string> {
		const lines = ( await this.listingPage.getWikitext() ).split( '\n' );
		const range = await this.getListingWikitextLines();

		if ( indent ) {
			// This usually isn't needed. {{CPC}} handles the bullet.
			message = (
				this.element.parentElement.tagName === 'LI' ?
					'*:' :
					':'
			) + message;
		}

		lines.splice( range.end + 1, 0, message );

		return lines.join( '\n' );
	}

	/**
	 * Adds a comment to an existing listing AND saves the page. To avoid saving the page,
	 * use `addComment` instead.
	 *
	 * @param message
	 * @param summary
	 * @param indent
	 */
	async respond(
		message: string,
		summary?: string,
		indent = false
	): Promise<void> {
		const newWikitext = await this.addComment( message, indent );

		await MwApi.action.postWithEditToken( {
			...changeTag( await window.InfringementAssistant.getWikiConfig() ),
			action: 'edit',
			format: 'json',
			formatversion: '2',
			utf8: 'true',
			title: this.listingPage.title.getPrefixedText(),
			text: newWikitext,
			summary: decorateEditSummary(
				summary ?? mw.msg(
					'deputy.ia.content.respond',
					this.listingPage.title.getPrefixedText(),
					this.title.getPrefixedText()
				),
				window.InfringementAssistant.config
			)
		} );
		await this.listingPage.getWikitext( true );
	}

	/**
	 * Serialize this listing. Used for tests.
	 */
	async serialize(): Promise<SerializedCopyrightProblemsListingData> {
		return {
			basic: this.basic,
			i: this.i,
			id: this.id,
			title: {
				namespace: this.title.namespace,
				title: this.title.title,
				fragment: this.title.getFragment()
			},
			listingPage: {
				namespace: this.listingPage.title.namespace,
				title: this.listingPage.title.title,
				fragment: this.listingPage.title.getFragment()
			},
			lines: await this.getListingWikitextLines()
		};
	}

}
