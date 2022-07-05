/**
 * Returns an index.php link with given parameters.
 *
 * @param options The search parameters
 * @param fragment The optional fragment
 * @return A URL string
 */
export default function indexURL( options: Record<string, any>, fragment?: string ) {
	const url = new URL( mw.config.get( 'wgScript' ), window.location.href );
	url.search = '?';
	for ( const index in options ) {
		url.search += `${index}=${options[ index ]}&`;
	}
	url.search = url.search.replace( /&$/, '' );

	if ( fragment ) {
		url.hash = fragment;
	}

	return url.toString();
}
