/**
 * The main class for Deputy. Handles almost everything.
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

	storage: typeof window.deputy.constructor.DeputyStorage;
	comms: typeof window.deputy.constructor.DeputyCommunications;
	session: typeof window.deputy.constructor.DeputySession;

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
		this.storage = new window.deputy.constructor.DeputyStorage();
		this.storage.init();
		// Initialize communications.
		this.comms = new window.deputy.constructor.DeputyCommunications();
		this.comms.init();
		// Initialize session.
		this.session = new window.deputy.constructor.DeputySession();
		this.session.init();

		console.log( 'Loaded!' );
	}

}

window.deputy = Deputy.instance;
