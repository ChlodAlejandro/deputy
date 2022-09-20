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
		const lang = window.deputyLang ?? 'en';

		// The loaded language resource file. Forced to `null` if using English, since English
		// is our fallback language.
		const langResource = lang === 'en' ? null :
			await DeputyResources.loadResource( `i18n/${module}/${lang}.json` )
				.catch( () => {
					// Could not find requested language file.
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

	/**
	 * Loads a specific moment.js locale. It's possible for nothing to be loaded (e.g. if the
	 * locale is not supported by moment.js), in which case nothing happens and English is
	 * likely used.
	 *
	 * @param locale The locale to load. `window.deputyLang` by default.
	 */
	static async loadMomentLocale( locale = window.deputyLang ) {
		if ( locale === 'en' ) {
			// Always loaded.
			return;
		}

		if ( window.moment.locales().indexOf( locale ) !== -1 ) {
			// Already loaded.
			return;
		}

		await mw.loader.using( 'moment' )
			.then( () => true, () => null );
		await mw.loader.getScript(
			new URL(
				`resources/lib/moment/locale/${ locale }.js`,
				new URL( mw.util.wikiScript( 'index' ), window.location.href )
			).toString()
		).then( () => true, () => null );
	}

}
