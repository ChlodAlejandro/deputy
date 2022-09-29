import MwApi from '../../MwApi';

/**
 * Renders wikitext as HTML.
 *
 * @param wikitext
 * @param title
 * @param options
 */
export default async function renderWikitext(
	wikitext: string,
	title: string,
	options: Record<string, any> = {}
): Promise<string & { summary?: string }> {
	return MwApi.action.post( Object.assign( {
		action: 'parse',
		title: title,
		text: wikitext,
		preview: true,
		disableeditsection: true,
		disablelimitreport: true
	}, options ) ).then( ( data ) => {
		return Object.assign( data.parse.text, {
			summary: data.parse.parsedsummary
		} );
	} );
}
