import Dispatch from './Dispatch';
import DispatchAsync, { DeputyDispatchTask } from './DispatchAsync';

/**
 *
 */
export default class DispatchUser {

	/**
	 * Singleton instance
	 */
	static readonly i = new DispatchUser();
	/**
	 *
	 */
	private constructor() { /* ignored */ }

	/**
	 * Gets the user's deleted pages.
	 *
	 * @param user
	 */
	async deletedPages( user: string ): Promise<DeputyDispatchTask<any>> {
		const endpoint = await Dispatch.i.getEndpoint( 'v1/user/deleted-pages' );
		return ( await DispatchAsync.makeRequest( endpoint, {
			user,
			wiki: mw.config.get( 'wgWikiID' )
		} ) );
	}

	/**
	 * Gets the user's deleted revisions.
	 *
	 * @param user
	 */
	async deletedRevisions( user: string ): Promise<DeputyDispatchTask<any>> {
		const endpoint = await Dispatch.i.getEndpoint( 'v1/user/deleted-revisions' );
		return ( await DispatchAsync.makeRequest( endpoint, {
			user,
			wiki: mw.config.get( 'wgWikiID' )
		} ) );
	}

	/**
	 * Gets the user's largest edits.
	 *
	 * @param user
	 * @param options
	 */
	async largestEdits(
		user: string,
		options: Partial<{
			namespaces: number[],
			withReverts: boolean,
			withoutTags: string[],
			offset: number
		}> = {},
	): Promise<DeputyDispatchTask<any>> {
		const endpoint = await Dispatch.i.getEndpoint( 'v1/user/search-talk' );
		return ( await DispatchAsync.makeRequest( endpoint, {
			...options,
			user,
			wiki: mw.config.get( 'wgWikiID' )
		} ) );
	}

	/**
	 * Search the user's talk page for certain additions/removals.
	 *
	 * @param user
	 * @param filters
	 */
	async searchTalk(
		user: string,
		filters: string | string[] | { source: string, flags: string }
	): Promise<DeputyDispatchTask<any>> {
		const endpoint = await Dispatch.i.getEndpoint( 'v1/user/search-talk' );
		return ( await DispatchAsync.makeRequest( endpoint, {
			user,
			filters,
			wiki: mw.config.get( 'wgWikiID' )
		} ) );
	}

}
