/**
 * Gets the URL of a diff page.
 *
 * @param from The revision to compare with
 * @param to The revision to compare from
 * @param includeCurrentParams `true` if the current query parameters should be included
 * @return The URL of the diff page
 */
export default function (
	from: number | 'cur' | 'prev' | 'oldid',
	to?: number | 'cur' | 'prev' | 'oldid',
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

		// Strip oldid from URL.
		if ( searchParams.has( 'oldid' ) ) {
			searchParams.delete( 'oldid' );
		}
	}
	url.search = '?' + searchParams.toString();
	url.hash = '';
	return url.toString();
}
