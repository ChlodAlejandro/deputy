/**
 *
 * @param from
 * @param to
 */
export default function ( from: number, to?: number ): string {
	const url = new URL( window.location.href );
	url.pathname = mw.util.wikiScript( 'index' );
	const searchParams = url.searchParams;
	for ( const key of Array.from( searchParams.keys() ) ) {
		searchParams.delete( key );
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
