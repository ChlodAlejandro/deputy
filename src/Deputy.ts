import './types';
import DeputyStorage from './DeputyStorage';
import DeputyCommunications from './DeputyCommunications';
import DeputySession from './session/DeputySession';
import DeputyCasePage from './wiki/DeputyCasePage';
import normalizeTitle from './util/normalizeTitle';
import DeputyAPI from './api/DeputyAPI';
import sectionHeadingName from './util/sectionHeadingName';
import ContributionSurveyRow from './models/ContributionSurveyRow';
import getPageContent from './util/getPageContent';
import cloneRegex from './util/cloneRegex';
import { DeputyPreferences } from './DeputyPreferences';
import performHacks from './util/performHacks';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import deputyStyles from './css/deputy.css';
import DeputyCase from './wiki/DeputyCase';
import unwrapWidget from './util/unwrapWidget';
import CopiedTemplateEditor from './modules/cte/CopiedTemplateEditor';
import DeputyLanguage from './DeputyLanguage';

/**
 * The main class for Deputy. Entry point for execution.
 *
 * This class is not exported to avoid circular references and extraneous
 * export code in the Rollup bundle (unnecessary for a userscript).
 */
class Deputy {

	/**
	 * Singleton for this class.
	 *
	 * @private
	 */
	static readonly instance: Deputy = new Deputy();
	readonly DeputyAPI = DeputyAPI;
	readonly DeputyStorage = DeputyStorage;
	readonly DeputySession = DeputySession;
	readonly DeputyPreferences = DeputyPreferences;
	readonly DeputyCommunications = DeputyCommunications;
	readonly DeputyCase = DeputyCase;
	readonly DeputyCasePage = DeputyCasePage;
	readonly models = {
		ContributionSurveyRow: ContributionSurveyRow
	};
	readonly util = {
		cloneRegex: cloneRegex,
		getPageContent: getPageContent,
		normalizeTitle: normalizeTitle,
		sectionHeadingName: sectionHeadingName
	};

	/**
	 * This version of Deputy.
	 *
	 * @type {string}
	 */
	version = '0.0.1';
	/**
	 * The current page as an mw.Title.
	 */
	currentPage = new mw.Title( mw.config.get( 'wgPageName' ) );
	/**
	 * The current page ID.
	 */
	currentPageId = mw.config.get( 'wgArticleId' );

	// Components

	wiki: mw.Api;
	wikiRest: mw.Rest;
	api: DeputyAPI;
	storage: DeputyStorage;
	prefs: DeputyPreferences;
	comms: DeputyCommunications;
	session: DeputySession;

	// Modules
	/**
	 * CopiedTemplateEditor instance.
	 */
	cte: CopiedTemplateEditor = new CopiedTemplateEditor( this );

	/**
	 * An OOUI WindowManager. Automatically instantiated when needed. See the
	 * `windowManager` getter for instantiation.
	 */
	_windowManager: any;

	/**
	 * @return An OOUI window manager
	 */
	get windowManager(): any {
		if ( !this._windowManager ) {
			this._windowManager = new OO.ui.WindowManager();
			document.body.appendChild( unwrapWidget( this._windowManager ) );
		}
		return this._windowManager;
	}

	/**
	 * Private constructor. To access Deputy, use `window.deputy` or Deputy.instance.
	 */
	private constructor() {
		/* ignored */
	}

	/**
	 * Initializes Deputy. By this point, the loader should have succeeded in loading
	 * all dependencies required for Deputy to work. It's only a matter of initializing
	 * sub-components as well.
	 */
	async init() {
		mw.hook( 'deputy.preload' ).fire( this );

		this.wiki = new mw.Api( {
			parameters: {
				format: 'json',
				formatversion: 2,
				utf8: 1,
				errorformat: 'html',
				errorlang: mw.config.get( 'wgUserLanguage' ),
				errorsuselocal: true
			}
		} );
		this.wikiRest = new mw.Rest();

		// Inject CSS
		mw.util.addCSS( deputyStyles );
		// Load languages
		await DeputyLanguage.load();

		// Initialize the storage.
		this.storage = new DeputyStorage();
		await this.storage.init();
		// Initialize the Deputy API interface
		this.api = new DeputyAPI();
		// Initialize the Deputy preferences instance
		this.prefs = new DeputyPreferences();
		// Initialize communications
		this.comms = new DeputyCommunications();
		this.comms.init();
		// Initialize session
		this.session = new DeputySession();
		await this.session.init();

		console.log( 'Loaded!' );

		mw.hook( 'deputy.load' ).fire( this );
	}

}

mw.loader.using( [
	'mediawiki.api',
	'mediawiki.Title',
	'mediawiki.util',
	'oojs'
], function () {
	performHacks();
	window.deputy = Deputy.instance;
	window.deputy.init();
} );

// We only want to export the type, not the actual class. This cuts down on
// code generated and also removes unnecessary exports/module code.
export type { Deputy };
