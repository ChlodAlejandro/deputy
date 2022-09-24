import normalizeTitle, { TitleLike } from './normalizeTitle';

/**
 * Gets the URL of a permanent link page.
 *
 * @param revid The revision ID to link to
 * @param page The title of the page to compare to
 * @param includeCurrentParams `true` if the current query parameters should be included
 * @return The URL of the diff page
 */
export default function (
	revid: number,
	page: TitleLike,
	includeCurrentParams = false
): string {
	const url = new URL( window.location.href );
	url.pathname = mw.util.wikiScript( 'index' );
	const searchParams = url.searchParams;
	if ( !includeCurrentParams ) {
		for ( const key of Array.from( searchParams.keys() ) ) {
			searchParams.delete( key );
		}
	}
	searchParams.set( 'title', normalizeTitle( page ).getPrefixedText() );
	searchParams.set( 'oldid', `${revid}` );

	url.search = '?' + searchParams.toString();
	url.hash = '';
	return url.toString();
}
