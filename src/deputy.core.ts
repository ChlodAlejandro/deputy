import DeputyStorage from './deputy.storage';
import DeputyCommunications from './deputy.comms';
import DeputySession from './deputy.session';

/**
 * The main class for Deputy. Entry point for execution.
 */
class Deputy {

	/**
	 * Singleton for this class.
	 *
	 * @private
	 */
	static readonly instance: Deputy = new Deputy();

	/**
	 * This version of Deputy.
	 *
	 * @type {string}
	 */
	version = '0.1.0';

	storage: DeputyStorage;
	comms: DeputyCommunications;
	session: DeputySession;

	/**
	 * Private constructor. To access Deputy, use `window.deputy` or Deputy.instance.
	 */
	private constructor() { /* ignored */ }

	/**
	 * Initializes Deputy. By this point, the loader should have succeeded in loading
	 * all dependencies required for Deputy to work. It's only a matter of initializing
	 * sub-components as well.
	 */
	init() {
		// Initialize the storage.
		this.storage = new DeputyStorage();
		this.storage.init();
		// Initialize communications.
		this.comms = new DeputyCommunications();
		this.comms.init();
		// Initialize session.
		this.session = new DeputySession();
		this.session.init();

		console.log( 'Loaded!' );
	}

}

window.deputy = Deputy.instance;
mw.loader.using( [ 'mediawiki.Title' ], function () {
	window.deputy.init();
} );
