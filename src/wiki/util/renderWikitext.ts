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
): Promise<string> {
	return MwApi.action.post( Object.assign( {
		action: 'parse',
		title: title,
		text: wikitext,
		preview: true,
		disableeditsection: true
	}, options ) ).then( ( data ) => data.parse.text );
}
