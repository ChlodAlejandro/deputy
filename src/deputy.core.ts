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

	/**
	 * Private constructor. To access Deputy, use `window.deputy` or Deputy.instance.
	 */
	private constructor() { /* ignored */ }

	/**
	 * Initializes Deputy.
	 */
	init() {
		mw.notify( 'Loaded!' );
	}

}

window.deputy = Deputy.instance;
