/**
 * Navigate to a Wikipedia page.
 *
 * @param targetPage The page to navigate to.
 */
export default async function ( targetPage: string ) {
	return page.goto(
		`https://en.wikipedia.org/wiki/${
			encodeURIComponent( targetPage.trim().replace( / /g, '_' ) )
		}`
	);
}
