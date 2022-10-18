import sleep from './sleep';

/**
 * Handles requests that might get hit by a rate limit. Wraps around
 * `fetch` and ensures that all users of the Requester only request
 * a single time per 100 ms on top of the time it takes to load
 * previous requests. Also runs on four "threads", allowing at
 * least a certain level of asynchronicity.
 *
 * Particularly used when a multitude of requests have a chance to
 * DoS a service.
 */
export default class Requester {

	/**
	 * Maximum number of requests to be processed simultaneously.
	 */
	static readonly maxThreads = 4;
	/**
	 * Minimum amount of milliseconds to wait between each request.
	 */
	static readonly minTime = 100;

	/**
	 * Requests to be performed. Takes tuples containing a resolve-reject pair and arguments
	 * to be passed into the fetch function.
	 */
	static readonly fetchQueue: [
		[( data: Response ) => void, ( reason?: any ) => void], any[]
	][] = [];
	/**
	 * Number of requests currently being processed. Must be lower than
	 * {@link maxThreads}.
	 */
	static fetchActive = 0;

	static readonly fetch: typeof window.fetch = ( ...args: any[] ) => {
		let res, rej;
		const fakePromise = new Promise<Response>( ( _res, _rej ) => {
			res = _res;
			rej = _rej;
		} );
		Requester.fetchQueue.push( [ [ res, rej ], args ] );
		setTimeout( Requester.processFetch, 0 );
		return fakePromise;
	};

	/**
	 * Processes things in the fetchQueue.
	 */
	static async processFetch() {
		if ( Requester.fetchActive >= Requester.maxThreads ) {
			return;
		}
		Requester.fetchActive++;

		const next = Requester.fetchQueue.shift();
		if ( next ) {

			const data : Response | /* survivable error */ number | /* when caught */ void =
				// eslint-disable-next-line prefer-spread
				await ( fetch.apply( null, next[ 1 ] ) as Promise<Response> )
					.then( ( res ) => {
						// Return false for survivable cases. In this case, we'll re-queue
						// the request.
						if ( res.status === 429 || res.status === 502 ) {
							return res.status;
						} else {
							return res;
						}
					}, next[ 0 ][ 1 ] );

			if ( data instanceof Response ) {
				next[ 0 ][ 0 ]( data );
			} else if ( typeof data === 'number' ) {
				Requester.fetchQueue.push( next );
			}
		}

		await sleep( Requester.minTime );
		Requester.fetchActive--;
		setTimeout( Requester.processFetch, 0 );
	}

}
