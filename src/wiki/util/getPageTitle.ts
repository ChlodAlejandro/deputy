import normalizeTitle from './normalizeTitle';
import MwApi from '../../MwApi';

/**
 * Gets the page title of a given page ID.
 *
 * @param pageID
 */
export default async function ( pageID: number ): Promise<mw.Title> {
	const pageIdQuery = await MwApi.action.get( {
		action: 'query',
		pageids: pageID
	} );

	const title = pageIdQuery?.query?.pages?.[ 0 ]?.title ?? null;
	return title == null ? null : normalizeTitle( title );
}
