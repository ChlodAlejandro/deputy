import warn from '../../util/warn';

interface DiffInfo {
	diff?: number | string;
	oldid?: number | string;
	title?: string;
}

/**
 * What it says on the tin. Attempt to parse out a `title`, `diff`,
 * or `oldid` from a URL. This is useful for converting diff URLs into actual
 * diff information, and especially useful for {{copied}} templates.
 *
 * @param url The URL to parse
 * @return Parsed info: `diff` or `oldid` revision IDs, and/or the page title.
 */
export default function parseDiffUrl( url: URL | string ): DiffInfo {
	if ( typeof url === 'string' ) {
		url = new URL( url );
	}

	// Attempt to get values from URL parameters (when using `/w/index.php?action=diff`)
	let oldid: string | number = url.searchParams.get( 'oldid' );
	let diff: string | number = url.searchParams.get( 'diff' );
	let title = url.searchParams.get( 'title' );

	// Attempt to get information from this URL.
	tryConvert: {
		if ( title && oldid && diff ) {
			// Skip if there's nothing else we need to get.
			break tryConvert;
		}

		// Attempt to get values from Special:Diff short-link
		const diffSpecialPageCheck =
			// eslint-disable-next-line security/detect-unsafe-regex
			/\/wiki\/Special:Diff\/(prev|next|\d+)(?:\/(prev|next|\d+))?/i.exec( url.pathname );
		if ( diffSpecialPageCheck != null ) {
			if (
				diffSpecialPageCheck[ 1 ] != null &&
				diffSpecialPageCheck[ 2 ] == null
			) {
				// Special:Diff/diff
				diff = diffSpecialPageCheck[ 1 ];
			} else if (
				diffSpecialPageCheck[ 1 ] != null &&
				diffSpecialPageCheck[ 2 ] != null
			) {
				// Special:Diff/oldid/diff
				oldid = diffSpecialPageCheck[ 1 ];
				diff = diffSpecialPageCheck[ 2 ];
			}
			break tryConvert;
		}

		// Attempt to get values from Special:PermanentLink short-link
		const permanentLinkCheck =
			/\/wiki\/Special:Perma(nent)?link\/(\d+)/i.exec( url.pathname );
		if ( permanentLinkCheck != null ) {
			oldid = permanentLinkCheck[ 2 ];
			break tryConvert;
		}

		// Attempt to get values from article path with ?oldid or ?diff
		// eslint-disable-next-line security/detect-non-literal-regexp
		const articlePathRegex = new RegExp( mw.util.getUrl( '(.*)' ) )
			.exec( url.pathname );
		if ( articlePathRegex != null ) {
			title = articlePathRegex[ 1 ];
			break tryConvert;
		}
	}

	// Convert numbers to numbers
	if ( oldid != null && !isNaN( +oldid ) ) {
		oldid = +oldid;
	}
	if ( diff != null && !isNaN( +diff ) ) {
		diff = +diff;
	}

	// Try to convert a page title
	try {
		title = new mw.Title( title ).getPrefixedText();
	} catch ( e ) {
		warn( 'Failed to normalize page title during diff URL conversion.' );
	}

	return {
		diff: diff,
		oldid: oldid,
		title: title
	};
}
