import './types';
import DeputyStorage from './DeputyStorage';
import DeputyCommunications from './DeputyCommunications';
import DeputySession from './session/DeputySession';
import DeputyCasePage from './wiki/DeputyCasePage';
import normalizeTitle from './wiki/util/normalizeTitle';
import DeputyAPI from './api/DeputyAPI';
import sectionHeadingName from './wiki/util/sectionHeadingName';
import ContributionSurveyRow from './models/ContributionSurveyRow';
import getPageContent from './wiki/util/getPageContent';
import cloneRegex from './util/cloneRegex';
import { DeputyPreferences } from './DeputyPreferences';
import performHacks from './wiki/util/performHacks';
import DeputyCase from './wiki/DeputyCase';
import unwrapWidget from './util/unwrapWidget';
import CopiedTemplateEditor from './modules/ante/CopiedTemplateEditor';
import DeputyLanguage from './DeputyLanguage';
import deputyVersion from './DeputyVersion';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import deputyStyles from './css/deputy.css';
import deputyCoreEnglish from '../i18n/core/en.json';
import deputySharedEnglish from '../i18n/shared/en.json';
import InfringementAssistant from './modules/ia/InfringementAssistant';
import Configuration from './config/Configuration';
import { attachConfigurationDialogPortletLink } from './ui/config/ConfigurationDialog';

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
	readonly modules = {
		CopiedTemplateEditor: CopiedTemplateEditor,
		InfringementAssistant: InfringementAssistant
	};

	/**
	 * This version of Deputy.
	 *
	 * @type {string}
	 */
	readonly version = deputyVersion;
	/**
	 * The current page as an mw.Title.
	 */
	currentPage = new mw.Title( mw.config.get( 'wgPageName' ) );
	/**
	 * The current page ID.
	 */
	currentPageId = mw.config.get( 'wgArticleId' );

	// Components

	api: DeputyAPI;
	storage: DeputyStorage;
	prefs: DeputyPreferences;
	comms: DeputyCommunications;
	session: DeputySession;
	config: Configuration;

	// Modules
	/**
	 * CopiedTemplateEditor instance.
	 */
	ante: CopiedTemplateEditor = new CopiedTemplateEditor( this );
	ia: InfringementAssistant = new InfringementAssistant( this );

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
		window.CopiedTemplateEditor = this.ante;
		window.InfringementAssistant = this.ia;
		mw.hook( 'deputy.preload' ).fire( this );

		// Inject CSS
		mw.util.addCSS( deputyStyles );
		// Load strings
		await DeputyLanguage.load( 'core', deputyCoreEnglish );
		await DeputyLanguage.load( 'shared', deputySharedEnglish );
		await attachConfigurationDialogPortletLink();

		// Initialize the configuration
		this.config = await Configuration.load();
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

		// Load modules
		await this.ante.preInit();
		await this.ia.preInit();

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
