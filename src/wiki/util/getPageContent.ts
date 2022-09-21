import normalizeTitle from './normalizeTitle';
import MwApi from '../../MwApi';

/**
 * Get the content of a page on-wiki.
 *
 * @param page The page to get
 * @param extraOptions Extra options to pass to the request
 * @param api The API object to use
 * @return A promise resolving to the page content
 */
export default function (
	page: mw.Title|string|number,
	extraOptions: Record<string, any> = {},
	api: mw.Api = MwApi.action
): PromiseLike<string & { contentFormat: string, revid: number, page: any }> {
	return api.get( {
		action: 'query',
		prop: 'revisions',
		...( typeof page === 'number' ? {
			pageids: page
		} : {
			titles: normalizeTitle( page ).getPrefixedText()
		} ),
		rvprop: 'ids|content',
		rvslots: 'main',
		rvlimit: '1',
		...extraOptions
	} ).then( ( data ) => {
		if ( data.query.pages[ 0 ].revisions == null ) {
			return null;
		}
		return Object.assign(
			data.query.pages[ 0 ].revisions[ 0 ].slots.main.content,
			{
				contentFormat: data.query.pages[ 0 ].revisions[ 0 ].slots.main.contentformat,
				revid: data.query.pages[ 0 ].revisions[ 0 ].revid,
				page: data.query.pages[ 0 ]
			}
		);
	} );
}
