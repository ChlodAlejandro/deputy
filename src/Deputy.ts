import './types';
import DeputyStorage from './DeputyStorage';
import DeputyCommunications from './DeputyCommunications';
import DeputySession from './DeputySession';
import DeputyCasePage from './wiki/DeputyCasePage';
import normalizeTitle from './util/normalizeTitle';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import deputyStyles from './css/deputy.css';

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
	readonly DeputyStorage = DeputyStorage;
	readonly DeputySession = DeputySession;
	readonly DeputyCommunications = DeputyCommunications;
	readonly DeputyCasePage = DeputyCasePage;
	readonly util = {
		normalizeTitle: normalizeTitle
	};

	/**
	 * This version of Deputy.
	 *
	 * @type {string}
	 */
	version = '0.1.0';
	/**
	 * The current page as an mw.Title.
	 */
	currentPage = new mw.Title( mw.config.get( 'wgPageName' ) );
	/**
	 * The current page ID.
	 */
	currentPageId = mw.config.get( 'wgArticleId' );

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
	async init() {
		// Insert CSS
		mw.util.addCSS( deputyStyles );

		// Initialize the storage.
		this.storage = new DeputyStorage();
		await this.storage.init();
		// Initialize communications.
		this.comms = new DeputyCommunications();
		this.comms.init();
		// Initialize session.
		this.session = new DeputySession();
		await this.session.init();

		console.log( 'Loaded!' );

		mw.hook( 'deputy.load' ).fire( this );
	}

}

mw.loader.using( [
	'mediawiki.Title',
	'oojs-ui-core',
	'oojs-ui.styles.icons-media'
], function () {
	window.deputy = Deputy.instance;
	if ( /[?&]deputy-autorun=false(?:&|$)/.test( window.location.search ) ) {
		window.deputy.init();
	}
} );

// We only want to export the type, not the actual class. This cuts down on
// code generated and also removes unnecessary exports/module code.
export type { Deputy };
