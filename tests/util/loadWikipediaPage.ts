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
}
