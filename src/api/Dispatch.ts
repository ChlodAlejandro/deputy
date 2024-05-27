import WikiConfiguration from '../config/WikiConfiguration';

/**
 * API communication class
 */
export default class Dispatch {

	/**
	 * Singleton instance.
	 */
	static readonly i = new Dispatch();

	/**
	 * Token used for authentication on the server side. Allows access to deleted
	 * revisions if the user has proper rights.
	 */
	static token?: string;

	/**
	 * Creates a Deputy API instance.
	 */
	private constructor() { /* ignored for now */ }

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
		Dispatch.token = await window.deputy.storage.getKV( 'api-token' );
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
	async getEndpoint( endpoint: string ): Promise<URL> {
		return new URL(
			endpoint.replace( /^\/+/, '' ),
			( await WikiConfiguration.load() ).core.dispatchRoot.get()
				.href
				.replace( /\/+$/, '' )
		);
	}

}
