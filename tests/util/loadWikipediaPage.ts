/**
 * Navigate to a Wikipedia page.
 *
 * @param targetPage The page to navigate to.
 * @param testWiki
 * @param timeout
 */
export default async function ( targetPage: string, testWiki = false, timeout?: number ) {
	await page.goto(
		`https://${testWiki ? 'test' : 'en'}.wikipedia.org/wiki/${
			encodeURIComponent( targetPage.trim().replace( / /g, '_' ) )
		}`, {
			timeout: timeout ?? 120e3,
			waitUntil: 'networkidle0'
		}
	);
}
