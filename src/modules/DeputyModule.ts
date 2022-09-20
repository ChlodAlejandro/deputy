import { Deputy } from '../Deputy';
import unwrapWidget from '../util/unwrapWidget';
import DeputyLanguage from '../DeputyLanguage';
import UserConfiguration from '../config/UserConfiguration';
import { attachConfigurationDialogPortletLink } from '../ui/config/ConfigurationDialog';
import WikiConfiguration from '../config/WikiConfiguration';

/**
 * A Deputy module. Modules are parts of Deputy that can usually be removed
 * and turned into standalone components that can load without Deputy.
 */
export default abstract class DeputyModule {

	/**
	 * An instance of Deputy. This is commonly `window.deputy`. Instantiating this class
	 * with a Deputy instances enables connection with the Deputy core, which shares the
	 * OOUI window manager and API manager for Deputy.
	 */
	protected readonly deputy?: Deputy;
	/**
	 * An OOUI WindowManager. If this class is instantiated standalone (without Deputy),
	 * this will be a set value.
	 */
	private _windowManager: any;
	/**
	 * The configuration object handling this module. Unavailable if Deputy is active.
	 *
	 * @private
	 */
	private _config: UserConfiguration;
	/**
	 * The wiki configuration object handling this module. Unavailable if Deputy is active.
	 *
	 * @private
	 */
	private _wikiConfig: WikiConfiguration;

	/**
	 * @return The responsible window manager for this class.
	 */
	get windowManager(): any {
		if ( !this.deputy ) {
			if ( !this._windowManager ) {
				this._windowManager = new OO.ui.WindowManager();
				document.body.appendChild( unwrapWidget( this._windowManager ) );
			}
			return this._windowManager;
		} else {
			return this.deputy.windowManager;
		}
	}

	/**
	 * @return the configuration handler for this module. If Deputy is loaded, this reuses
	 * the configuration handler of Deputy.
	 */
	get config(): UserConfiguration {
		if ( !this.deputy ) {
			return this._config ?? ( this._config = UserConfiguration.load() );
		} else {
			return this.deputy.config;
		}
	}

	/**
	 * @return the wiki-wide configuration handler for this module. If Deputy is loaded,
	 * this reuses the configuration handler of Deputy. Since the wiki config is loaded
	 * asynchronously, this may not be populated at runtime. Only use it if you're sure
	 * that `preInit` has already been called and finished.
	 */
	get wikiConfig(): WikiConfiguration {
		return this.deputy ? this.deputy.wikiConfig : this._wikiConfig;
	}

	/**
	 *
	 * @param deputy
	 */
	constructor( deputy?: Deputy ) {
		this.deputy = deputy;
	}

	/**
	 * @return the symbolic name of this module. Eventually used for getting translation
	 * strings, etc.
	 */
	abstract getName(): string;

	/**
	 * Load the language pack for this module, with a fallback in case one could not be
	 * loaded.
	 *
	 * @param fallback The fallback to use if a language pack could not be loaded.
	 */
	async loadLanguages( fallback: Record<string, string> ): Promise<void> {
		await Promise.all( [
			DeputyLanguage.load( this.getName(), fallback ),
			DeputyLanguage.loadMomentLocale()
		] );
	}

	/**
	 * Pre-initialize the module. This is the opportunity of the module to load language
	 * strings, append important UI elements, add portlets, etc.
	 *
	 * @param languageFallback The fallback language pack to use if one could not be loaded.
	 */
	async preInit( languageFallback: Record<string, string> ): Promise<boolean> {
		await this.getWikiConfig();

		if ( this.wikiConfig[ this.getName() as 'ia' | 'ante' ]?.enabled.get() !== true ) {
			// Stop loading here.
			console.warn( `[Deputy] Preinit for ${
				this.getName()
			} cancelled; module is disabled.` );
			return false;
		}

		await this.loadLanguages( languageFallback );
		await attachConfigurationDialogPortletLink();

		return true;
	}

	/**
	 * Gets the wiki-specific configuration for Deputy.
	 *
	 * @return A promise resolving to the loaded configuration
	 */
	async getWikiConfig(): Promise<WikiConfiguration> {
		if ( this.deputy ) {
			return this.deputy.getWikiConfig();
		} else {
			return this._wikiConfig ?? ( this._wikiConfig = await WikiConfiguration.load() );
		}
	}

}
