import { deputyVersion } from '../DeputyVersion';

interface DeputyDispatchTaskOptions {
	/**
	 * The rate in milliseconds at which new progress requests are made.
	 *
	 *  @default 500
	 */
	refreshRate?: number;
}

/**
 *
 */
export class DeputyDispatchTask<T> extends EventTarget implements DeputyDispatchTaskOptions {

	id: string;
	progress = 0;
	finished = false;
	baseEndpoint: URL;
	promise: Promise<T>;

	refreshRate: number;

	/**
	 * @return The endpoint for retrieving this task's progress
	 */
	get progressEndpoint(): URL {
		const u = new URL( this.id + '/progress', this.baseEndpoint );
		u.search = '';
		return u;
	}

	/**
	 * @return The endpoint for retrieving this task's result
	 */
	get resultEndpoint(): URL {
		const u = new URL( this.id, this.baseEndpoint );
		u.search = '';
		return u;
	}

	/**
	 *
	 * @param endpoint
	 * @param id
	 * @param options
	 */
	constructor( endpoint: URL, id: string, options: DeputyDispatchTaskOptions ) {
		super();
		this.baseEndpoint = new URL( endpoint );
		if ( !this.baseEndpoint.pathname.endsWith( '/' ) ) {
			this.baseEndpoint.pathname += '/';
		}
		this.id = id;

		this.refreshRate = options.refreshRate ?? 500;

		// Execute last.
		this.promise = this.waitUntilDone();
	}

	/**
	 * Get the progress of this task.
	 *
	 * @return A tuple containing the progress and the `finished` boolean.
	 */
	async fetchProgress(): Promise<[number, boolean]> {
		return fetch( this.progressEndpoint )
			.then( r => r.json() )
			.then( d => [ d.progress, d.finished ] );
	}

	/**
	 * Get the result of this task.
	 *
	 * @return The result of the task.
	 */
	async fetchResult(): Promise<T> {
		return fetch( this.resultEndpoint )
			.then( r => r.json() );
	}

	/**
	 * Wait until this task has finished running.
	 */
	async waitUntilDone(): Promise<T> {
		while ( !this.finished ) {
			const [ progress, finished ] = await this.fetchProgress();
			if ( progress !== this.progress ) {
				this.progress = progress;
				this.dispatchEvent( new CustomEvent( 'progress', { detail: progress } ) );
			}
			if ( finished !== this.finished ) {
				this.finished = finished;
				this.dispatchEvent( new CustomEvent( 'finished' ) );
			}
			await new Promise( r => setTimeout( r, this.refreshRate ) );
		}

		return this.fetchResult();
	}

}

/**
 * Utility class for making Deputy Dispatch asynchronous requests.
 *
 * An asynchronous request is a special type of request made to the endpoint. It
 * starts with a POST on the target endpoint with the relevant data, which returns
 * a special ID. This ID can then be used to periodically poll the server for task
 * status, and eventually be used to get the data back from the server.
 */
export default class DispatchAsync {

	/**
	 *
	 * @param endpoint
	 * @param options
	 * @param taskOptions
	 */
	static async makeRequest<T>(
		endpoint: URL,
		options: Record<string, any>,
		taskOptions: DeputyDispatchTaskOptions = {}
	): Promise<DeputyDispatchTask<T>> {
		const taskInfo = await fetch( endpoint, {
			method: 'POST',
			body: JSON.stringify( options ),
			headers: {
				'Content-Type': 'application/json',
				'Api-User-Agent': `Deputy/${deputyVersion} (${window.location.hostname})`
			},
			redirect: 'follow'
		} )
			.then( r => {
				if ( r.status !== 202 ) {
					throw new Error( `DeputyDispatchAsync: Unexpected status code ${r.status}` );
				}
				return r;
			} )
			.then( r => r.json() );

		return new DeputyDispatchTask( endpoint, taskInfo.id, taskOptions );
	}

}
