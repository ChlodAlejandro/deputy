import { ExpandedRevisionData } from './ExpandedRevisionData';
import Requester from '../util/Requester';

/**
 * API communication class
 */
export default class DeputyDispatch {

	/**
	 * Token used for authentication on the server side. Allows access to deleted
	 * revisions if the user has proper rights.
	 */
	token?: string;

	/**
	 * Creates a Deputy API instance.
	 */
	constructor() { /* ignored for now */ }

	/**
	 * Logs the user out of the API.
	 */
	async logout() {
		// TODO: Make logout API request
		await window.deputy.storage.setKV( 'api-token', null );
	}

	/**
	 * Logs in the user. Optional: only used for getting data on deleted revisions.
	 */
	async login() {
		this.token = await window.deputy.storage.getKV( 'api-token' );
		// TODO: If token, set token
		// TODO: If no token, start OAuth flow and make login API request
		throw new Error( 'Unimplemented method.' );
	}

	/**
	 * Returns a fully-formed HTTP URL from a given endpoint. This uses the wiki's
	 * set Dispatch endpoint and a given target (such as `/v1/revisions`) to get
	 * the full URL.
	 *
	 * @param endpoint The endpoint to get
	 */
	async getEndpoint( endpoint: string ): Promise<string> {
		return `${
			( await window.deputy.getWikiConfig() ).core.dispatchRoot.get()
				.href
				.replace( /\/+$/, '' )
		}/${
			endpoint.replace( /^\/+/, '' )
		}`;
	}

	/**
	 * Gets expanded revision data from the API. This returns a response similar to the
	 * `revisions` object provided by action=query, but also includes additional information
	 * relevant (such as the parsed (HTML) comment, diff size, etc.)
	 *
	 * @param revisions The revisions to get the data for
	 * @return An object of expanded revision data mapped by revision IDs
	 */
	async getExpandedRevisionData(
		revisions: number[]
	): Promise<Record<number, ExpandedRevisionData>> {
		return Requester.fetch(
			await this.getEndpoint( `v1/revisions/${mw.config.get( 'wgWikiID' )} ` ),
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
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
