import normalizeWikiHeading from './normalizeWikiHeading';

/**
 * Check if a given parameter is a wikitext heading parsed into HTML.
 *
 * Alias for `normalizeWikiHeading( el ) != null`.
 *
 * @param el The element to check
 * @return `true` if the element is a heading, `false` otherwise
 */
export default function isWikiHeading( el: Element ): boolean {
	return normalizeWikiHeading( el ) != null;
}
