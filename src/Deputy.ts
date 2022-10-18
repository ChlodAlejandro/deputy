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
import UserConfiguration from './config/UserConfiguration';
import { attachConfigurationDialogPortletLink } from './ui/config/ConfigurationDialog';
import WikiConfiguration from './config/WikiConfiguration';
import Recents from './wiki/Recents';

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
	static instance: Deputy;
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
	config: UserConfiguration;
	wikiConfig: WikiConfiguration;

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
	 * Initialize Deputy.
	 */
	static async init(): Promise<void> {
		Deputy.instance = new Deputy();
		window.deputy = Deputy.instance;
		return window.deputy.init();
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

		// Initialize the configuration
		this.config = await UserConfiguration.load();
		window.deputyLang = this.config.core.language.get();

		// Inject CSS
		mw.util.addCSS( deputyStyles );
		// Load strings
		await Promise.all( [
			DeputyLanguage.load( 'core', deputyCoreEnglish ),
			DeputyLanguage.load( 'shared', deputySharedEnglish ),
			DeputyLanguage.loadMomentLocale()
		] );
		mw.hook( 'deputy.i18nDone' ).fire( this );
		await attachConfigurationDialogPortletLink();

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

		if ( this.config.core.modules.get().indexOf( 'cci' ) !== -1 ) {
			await this.session.init();
		}

		// Load modules
		if ( this.config.core.modules.get().indexOf( 'ante' ) !== -1 ) {
			await this.ante.preInit();
		}
		if ( this.config.core.modules.get().indexOf( 'ia' ) !== -1 ) {
			await this.ia.preInit();
		}
		await this.wikiConfig.prepareEditBanners();

		console.log( 'Loaded!' );

		mw.hook( 'deputy.load' ).fire( this );

		// Asynchronously reload wiki configuration.
		this.wikiConfig.update().catch( () => { /* silently fail */ } );
	}

	/**
	 * Gets the wiki-specific configuration for Deputy.
	 *
	 * @return A promise resolving to the loaded configuration
	 */
	async getWikiConfig(): Promise<WikiConfiguration> {
		return this.wikiConfig ?? ( this.wikiConfig = await WikiConfiguration.load() );
	}

}

mw.loader.using( [
	'mediawiki.api',
	'mediawiki.jqueryMsg',
	'mediawiki.Title',
	'mediawiki.util',
	'moment',
	'oojs'
], function () {
	Recents.save();
	performHacks();
	Deputy.init();
} );

// We only want to export the type, not the actual class. This cuts down on
// code generated and also removes unnecessary exports/module code.
export type { Deputy };
