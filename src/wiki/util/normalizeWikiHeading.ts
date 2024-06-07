import last from '../../util/last';

/**
 * Each WikiHeadingType implies specific fields in {@link WikiHeading}:
 *
 * - `PARSOID` implies that there is no headline element, and that the `h`
 *   element is the root heading element. This means `h.innerText` will be
 *   "Section title".
 * - `OLD` implies that there is a headline element and possibly an editsection
 *   element, and that the `h` is the root heading element. This means that
 *   `h.innerText` will be "Section title[edit | edit source]" or similar.
 * - `NEW` implies that there is a headline element and possibly an editsection
 *   element, and that a `div` is the root heading element. This means that
 *   `h.innerText` will be "Section title".
 */
export enum WikiHeadingType {
	PARSOID,
	OLD,
	NEW
}

/**
 * A parsed wikitext heading.
 */
export interface WikiHeading {
	/**
	 * The type of this heading.
	 */
	type: WikiHeadingType,
	/**
	 * The root element of this heading. This refers to the topmost element
	 * related to this heading, excluding the `<section>` which contains it.
	 */
	root: Element,
	/**
	 * The `<h*>` element of this heading.
	 */
	h: HTMLHeadingElement,
	/**
	 * The ID of this heading. Also known as the fragment. On Parsoid, this
	 * is the `html5` fragment mode (mostly Unicode characters).
	 */
	id: string,
	/**
	 * The title of this heading. This is the actual text that the reader can
	 * see, and the actual text that matters. Unsupported syntax, such as using
	 * `<math>` templates in the heading, may not work.
	 */
	title: string,
	/**
	 * The level of this heading. Goes from 1 to 6, referring to h1 to h6.
	 */
	level: number
}

/**
 * Get relevant information from an H* element in a section heading.
 *
 * @param headingElement The heading element
 * @return An object containing the relevant {@link WikiHeading} fields.
 */
function getHeadingElementInfo( headingElement: HTMLHeadingElement ):
	Pick<WikiHeading, 'h' | 'id' | 'title' | 'level'> {
	return {
		h: headingElement,
		id: headingElement.id,
		title: headingElement.innerText,
		level: +last( headingElement.tagName )
	};
}

/**
 * Annoyingly, there are many different ways that a heading can be parsed
 * into depending on the version and the parser used for given wikitext.
 *
 * In order to properly perform such wiki heading checks, we need to identify
 * if a given element is part of a wiki heading, and perform a normalization
 * if so.
 *
 * Since this function needs to check many things before deciding if a given
 * HTML element is part of a section heading or not, this also acts as an
 * `isWikiHeading` check.
 *
 * The layout for a heading differs depending on the MediaWiki version:
 *
 * <b>On 1.43+ (Parser)</b>
 * ```html
 * <div class="mw-heading mw-heading2">
 *     <h2 id="Parsed_wikitext...">Parsed <i>wikitext</i>...</h2>
 *     <span class="mw-editsection>...</span>
 * </div>
 * ```
 *
 * <b>On Parsoid</b>
 * ```html
 * <h2 id="Parsed_wikitext...">Parsed <i>wikitext</i>...</h2>
 * ```
 *
 * <b>On pre-1.43</b>
 * ```html
 * <h2>
 *     <span class="mw-headline" id="Parsed_wikitext...">Parsed <i>wikitext</i>...</span>
 *     <span class="mw-editsection">...</span>
 * </h2>
 * ```
 *
 * <b>Worst case execution time</b> would be if this was run with an element which was
 * outside a heading and deeply nested within the page.
 *
 * Backwards-compatibility support may be removed in the future. This function does not
 * support Parsoid specification versions lower than 2.0.
 *
 * @param node The node to check for
 * @param ceiling An element which `node` must be in to be a valid heading.
 *                This is set to the `.mw-parser-output` element by default.
 * @return The root heading element (can be an &lt;h2&gt; or &lt;div&gt;),
 *         or `null` if it is not a valid heading.
 */
export default function normalizeWikiHeading( node: Node, ceiling?: Element ): WikiHeading | null {
	if ( node == null ) {
		// Not valid input, obviously.
		return null;
	}

	const rootNode = node.getRootNode();

	// Break out of text nodes until we hit an element node.
	while ( node.nodeType !== node.ELEMENT_NODE ) {
		node = node.parentNode;

		if ( node === rootNode ) {
			// We've gone too far and hit the root. This is not a wiki heading.
			return null;
		}
	}

	// node is now surely an element.
	let elementNode = node as Element;

	// If this node is the 1.43+ heading root, return it immediately.
	if ( elementNode.classList.contains( 'mw-heading' ) ) {
		return {
			type: WikiHeadingType.NEW,
			root: elementNode,
			...getHeadingElementInfo(
				Array.from( elementNode.children )
					.find( v =>/^H[123456]$/.test( v.tagName ) ) as HTMLHeadingElement
			)
		};
	}

	// Otherwise, we're either inside or outside a mw-heading.
	// To determine if we are inside or outside, we keep climbing up until
	// we either hit an <hN> or a given stop point.
	// The stop point is, by default, `.mw-parser-output`, which exists both in a
	// Parsoid document and in standard parser output. If such an element doesn't
	// exist in this document, we just stop at the root element.
	ceiling = ceiling ??
		elementNode.ownerDocument.querySelector( '.mw-parser-output' ) ??
		elementNode.ownerDocument.documentElement;

	// While we haven't hit a heading, keep going up.
	while ( elementNode !== ceiling ) {
		if ( /^H[123456]$/.test( elementNode.tagName ) ) {
			// This element is a heading!
			// Now determine if this is a MediaWiki heading.

			if ( elementNode.parentElement.classList.contains( 'mw-heading' ) ) {
				// This element's parent is a `div.mw-heading`!
				return {
					type: WikiHeadingType.NEW,
					root: elementNode.parentElement,
					...getHeadingElementInfo( elementNode as HTMLHeadingElement )
				};
			} else {
				const headline: HTMLElement = elementNode.querySelector( ':scope > .mw-headline' );
				if ( headline != null ) {
					// This element has a `.mw-headline` child!
					return {
						type: WikiHeadingType.OLD,
						root: elementNode,
						h: elementNode as HTMLHeadingElement,
						id: headline.id,
						title: headline.innerText,
						level: +last( elementNode.tagName )
					};
				} else if (
					elementNode.parentElement.tagName === 'SECTION' &&
					elementNode.parentElement.firstElementChild === elementNode
				) {
					// A <section> element is directly above this element, and it is the
					// first element of that section!
					// This is a specific format followed by the 2.8.0 MediaWiki Parsoid spec.
					// https://www.mediawiki.org/wiki/Specs/HTML/2.8.0#Headings_and_Sections
					return {
						type: WikiHeadingType.PARSOID,
						root: elementNode,
						h: elementNode as HTMLHeadingElement,
						id: elementNode.id,
						title: ( elementNode as HTMLElement ).innerText,
						level: +last( elementNode.tagName )
					};
				} else {
					// This is a heading, but we can't figure out how it works.
					// This usually means something inserted an <h2> into the DOM, and we
					// accidentally picked it up.
					// In that case, discard it.
					return null;
				}
			}
		} else if ( elementNode.classList.contains( 'mw-heading' ) ) {
			// This element is the `div.mw-heading`!
			// This usually happens when we selected an element from inside the
			// `span.mw-editsection` span.
			return {
				type: WikiHeadingType.NEW,
				root: elementNode,
				...getHeadingElementInfo(
					Array.from( elementNode.children )
						.find( v =>/^H[123456]$/.test( v.tagName ) ) as HTMLHeadingElement
				)
			};
		} else {
			// Haven't reached the top part of a heading yet, or we are not
			// in a heading. Keep climbing up the tree until we hit the ceiling.
			elementNode = elementNode.parentElement;
		}
	}

	// We hit the ceiling. This is not a wiki heading.
	return null;
}
