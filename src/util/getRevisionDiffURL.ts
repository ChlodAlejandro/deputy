/**
 * Gets the URL of a diff page.
 *
 * @param from The revision to compare with
 * @param to The revision to compare from
 * @param includeCurrentParams `true` if the current query parameters should be included
 * @return The URL of the diff page
 */
export default function (
	from: number,
	to?: number,
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
	if ( to != null ) {
		searchParams.set( 'diff', to.toString() );
		searchParams.set( 'oldid', from.toString() );
	} else {
		searchParams.set( 'diff', from.toString() );
	}
	url.search = '?' + searchParams.toString();
	url.hash = '';
	return url.toString();
}
