import normalizeTitle from './normalizeTitle';
import getSectionId from './getSectionId';

/**
 * Get the parser output HTML of a specific page section.
 *
 * @param page
 * @param section
 * @param extraOptions
 * @return A promise resolving to the `<div class="mw-parser-output">` element.
 */
export default async function (
	page: mw.Title | string,
	section: number | string,
	extraOptions: Record<string, any> = {}
): Promise<{ element: HTMLDivElement, wikitext: string }> {
	if ( typeof section === 'string' ) {
		section = await getSectionId( page, section );
	}

	return window.deputy.wiki.get( {
		action: 'parse',
		prop: 'text|wikitext',
		page: normalizeTitle( page ).getPrefixedText(),
		section: section,
		disablelimitreport: true,
		...extraOptions
	} ).then( ( data ) => {
		const temp = document.createElement( 'span' );
		temp.innerHTML = data.parse.text;

		return {
			element: temp.children[ 0 ] as HTMLDivElement,
			wikitext: data.parse.wikitext
		};
	} );
}
