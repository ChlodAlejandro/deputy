import { ExpandedRevisionData } from './ExpandedRevisionData';
import Requester from '../util/Requester';
import Dispatch from './Dispatch';
import { deputyVersion } from '../DeputyVersion';

/**
 *
 */
export default class DispatchRevisions {

	/**
	 * Singleton instance
	 */
	static readonly i = new DispatchRevisions();
	/**
	 *
	 */
	private constructor() { /* ignored */ }

	/**
	 * Gets expanded revision data from the API. This returns a response similar to the
	 * `revisions` object provided by action=query, but also includes additional information
	 * relevant (such as the parsed (HTML) comment, diff size, etc.)
	 *
	 * @param revisions The revisions to get the data for
	 * @return An object of expanded revision data mapped by revision IDs
	 */
	async get(
		revisions: number[]
	): Promise<Record<number, ExpandedRevisionData>> {
		return Requester.fetch(
			await Dispatch.i.getEndpoint(
				`v1/revisions/${mw.config.get( 'wgWikiID' )}`
			),
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Api-User-Agent': `Deputy/${deputyVersion} (${window.location.hostname})`
				},
				body: 'revisions=' + revisions.join( '|' )
			}
		)
			.then( ( r ) => r.json() )
			.then( ( j ) => {
				if ( j.error ) {
					throw new Error( j.error.info );
				}

				return j;
			} )
			.then( ( j ) => j.revisions );
	}

}
