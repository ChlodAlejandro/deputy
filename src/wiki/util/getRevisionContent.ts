import MwApi from '../../MwApi';

/**
 * Get the content of a revision on-wiki.
 *
 * @param revision The revision ID of the revision to get the content of
 * @param extraOptions Extra options to pass to the request
 * @param api The API object to use
 * @return A promise resolving to the page content
 */
export default function (
	revision: number,
	extraOptions: Record<string, any> = {},
	api: mw.Api = MwApi.action
): PromiseLike<string & { contentFormat: string }> {
	return api.get( {
		action: 'query',
		revids: revision,
		rvprop: 'content',
		rvslots: 'main',
		rvlimit: '1',
		...extraOptions
	} ).then( ( data ) => {
		return Object.assign(
			data.query.pages[ 0 ].revisions[ 0 ].slots.main.content,
			{ contentFormat: data.query.pages[ 0 ].revisions[ 0 ].slots.main.contentformat }
		);
	} );
}
