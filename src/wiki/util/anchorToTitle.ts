/**
 * Extracts a page title from a MediaWiki anchor. If the anchor does not validly link
 * to a MediaWiki page, `false` is returned.
 *
 * The part of the anchor used to determine the page title depends on how trustworthy
 * the data is in telling the correct title. If the anchor does not have an `href`, only
 * two routes are available: the selflink check and the `title` attribute check.
 *
 * The following methods are used, in order.
 * - `title` parameter from anchor href
 * - `/wiki/$1` path from anchor href
 * - `./$1` path from Parsoid document anchor href
 * - selflinks (not run on Parsoid)
 * - `title` attribute from anchor
 *
 * @param el
 * @return the page linked to
 */
export default function anchorToTitle( el: HTMLAnchorElement ): mw.Title | false {
	const href = el.getAttribute( 'href' );
	const articlePathRegex = new RegExp( mw.util.getUrl( '(.*)' ) );

	if ( href && href.startsWith( mw.util.wikiScript( 'index' ) ) ) {
		// The link matches the script path (`/w/index.php`).
		// This is the branch used in cases where the page does not exist. The section is always
		// dropped from the link, so no section filtering needs to be done.

		// Attempt to extract page title from `title` parameter.
		const titleRegex = /[?&]title=(.*?)(?:&|$)/;
		if ( titleRegex.test( href ) ) {
			return new mw.Title( titleRegex.exec( href )[ 1 ] );
		} else {
			// Not a valid link.
			return false;
		}
	}

	if ( href && articlePathRegex.test( href ) ) {
		// The link matches the article path (`/wiki/$1`) RegExp.
		return new mw.Title( decodeURIComponent( articlePathRegex.exec( href )[ 1 ] ) );
	}

	if ( el.getAttribute( 'rel' ) === 'mw:WikiLink' ) {
		// Checks for Parsoid documents.

		if ( href ) {
			const parsoidHrefMatch = articlePathRegex.exec( href.replace(
				/^\.\/([^#]+).*$/, mw.config.get( 'wgArticlePath' )
			) );
			if ( parsoidHrefMatch != null ) {
				// The link matches the Parsoid link format (`./$1`).
				return new mw.Title( decodeURIComponent( href.slice( 2 ) ) );
			}
		}
	} else {
		// Checks for non-Parsoid documents

		if ( el.classList.contains( 'mw-selflink' ) ) {
			// Self link. Return current page name.
			return new mw.Title( el.ownerDocument.defaultView.mw.config.get( 'wgPageName' ) );
		}
	}

	// If we still can't find a title by this point, rely on the `title` attribute.
	// This is unstable, since the title may be set or modified by other userscripts, so it
	// is only used as a last resort.
	if (
		el.hasAttribute( 'title' ) &&
		// Not a redlink
		!el.classList.contains( 'new' ) &&
		// Not an external link
		!el.classList.contains( 'external' )
	) {
		return new mw.Title( el.getAttribute( 'title' ) );
	}

	// Not a valid link.
	return false;
}
