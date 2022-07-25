import { DeputyResources } from './DeputyResources';

/**
 * Handles internationalization and localization for Deputy and sub-modules.
 */
export default class DeputyLanguage {

	/**
	 * Loads the language for this Deputy interface.
	 *
	 * @param module The module to load a language pack for.
	 * @param fallback A fallback language pack to load. Since this is an actual
	 * `Record`, this relies on the language being bundled with the userscript. This ensures
	 * that a language pack is always available, even if a language file could not be loaded.
	 */
	static async load( module: string, fallback: Record<string, string> ) {
		const lang = window.deputyLang ?? mw.config.get( 'wgUserLanguage' ) ?? 'en';

		// The loaded language resource file. Forced to `null` if using English, since English
		// is our fallback language.
		const langResource = lang === 'en' ? null :
			await DeputyResources.loadResource( `i18n/${module}/${lang}.json` )
				.catch( () => {
					if ( window.deputyLang ) {
					// Only show this warning if a language was explicitly requested. There are
					// cases where Deputy does not yet have a language file (likely due to a lack
					// of translations), but the user has a 'wgUserLanguage' differing from
					// English.
						mw.notify(
						// No languages to fall back on. Do not translate this string.
							'Deputy: Could not load requested language file.',
							{ type: 'error' }
						);
					}
					return null;
				} );
		if ( !langResource ) {
			// Fall back.
			for ( const key in fallback ) {
				mw.messages.set( key, ( fallback as Record<string, string> )[ key ] );
			}

			return;
		}

		try {
			const langData = JSON.parse( langResource );
			for ( const key in langData ) {
				mw.messages.set( key, langData[ key ] );
			}
		} catch ( e ) {
			mw.notify(
				// No languages to fall back on. Do not translate this string.
				'Deputy: Requested language page is not a valid JSON file.',
				{ type: 'error' }
			);

			// Fall back.
			for ( const key in fallback ) {
				mw.messages.set( key, ( fallback as Record<string, string> )[ key ] );
			}
		}
	}

}
