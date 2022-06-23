/**
 * Navigate to a Wikipedia page.
 *
 * @param targetPage The page to navigate to.
 * @param testWiki
 */
export default async function ( targetPage: string, testWiki = false ) {
	await page.goto(
		`https://${testWiki ? 'test' : 'en'}.wikipedia.org/wiki/${
			encodeURIComponent( targetPage.trim().replace( / /g, '_' ) )
		}`, {
			timeout: 120e3
		}
	);

	// Ban editing
	if ( !testWiki ) {
		await page.setRequestInterception( true );
		page.on( 'request', ( request ) => {
			const postData = request.postData();
			switch ( request.method() ) {
				case 'POST':
					if (
						// URL-encoded
						/\baction=edit\b/.test( postData ) ||
						// Form data
						/\bname="(visualeditor)?edit"\b/.test( postData )
					) {
						request.abort();
					}
					break;
			}
		} );
	}
}
