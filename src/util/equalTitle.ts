import normalizeTitle from '../wiki/util/normalizeTitle';

/**
 * Checks if two MediaWiki page titles are equal.
 *
 * @param title1
 * @param title2
 * @return `true` if `title1` and `title2` refer to the same page
 */
export default function equalTitle(
	title1: string | mw.Title,
	title2: string | mw.Title
): boolean {
	return normalizeTitle( title1 ).getPrefixedDb() === normalizeTitle( title2 ).getPrefixedDb();
}
