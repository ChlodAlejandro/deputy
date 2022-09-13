import { Deputy } from '../Deputy';
import unwrapWidget from '../util/unwrapWidget';
import DeputyLanguage from '../DeputyLanguage';
import Configuration from '../config/Configuration';

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
	 * The configuration object handling this module.
	 */
	private _config: Configuration;

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
	get config(): Configuration {
		if ( !this.deputy ) {
			return this._config ?? ( this._config = Configuration.load() );
		} else {
			return this.deputy.config;
		}
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
		await DeputyLanguage.load( this.getName(), fallback );
	}

	/**
	 * Pre-initialize the module. This is the opportunity of the module to load language
	 * strings, append important UI elements, add portlets, etc.
	 *
	 * @param languageFallback The fallback language pack to use if one could not be loaded.
	 */
	async preInit( languageFallback: Record<string, string> ): Promise<void> {
		await this.loadLanguages( languageFallback );
	}

}
