import { DeputyResources } from './DeputyResources';
import cloneRegex from './util/cloneRegex';
import error from './util/error';
import warn from './util/warn';
import { USER_LOCALE } from './wiki/Locale';

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
			error( e );
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

		if ( lang !== mw.config.get( 'wgUserLanguage' ) ) {
			await DeputyLanguage.loadSecondary();
		}
	}

	/**
	 * Loads a specific moment.js locale. It's possible for nothing to be loaded (e.g. if the
	 * locale is not supported by moment.js), in which case nothing happens and English is
	 * likely used.
	 *
	 * @param locale The locale to load. `window.deputyLang` by default.
	 */
	static async loadMomentLocale( locale = USER_LOCALE ) {
		if ( locale === 'en' ) {
			// Always loaded.
			return;
		}

		if ( mw.loader.getState( 'moment' ) !== 'ready' ) {
			// moment.js is not yet loaded.
			warn(
				'Deputy tried loading moment.js locales but moment.js is not yet ready.'
			);
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
			).href
		).then( () => true, () => null );
	}

	/**
	 * There are times when the user interface language do not match the wiki content
	 * language. Since Deputy's edit summary and content strings are found in the
	 * i18n files, however, there are cases where the wrong language would be used.
	 *
	 * This solves this problem by manually overriding content-specific i18n keys with
	 * the correct language. By default, all keys that match `deputy.*.content.**` get
	 * overridden.
	 *
	 * There are no fallbacks for this. If it fails, the user interface language is
	 * used anyway. In the event that the user interface language is not English,
	 * this will cause awkward situations. Whether or not something should be done to
	 * catch this specific edge case will depend on how frequent it happens.
	 *
	 * @param locale
	 * @param match
	 */
	static async loadSecondary(
		locale = mw.config.get( 'wgContentLanguage' ),
		match = /^deputy\.(?:[^.]+)?\.content\./g
	) {
		// The loaded language resource file. Forced to `null` if using English, since English
		// is our fallback language.
		const langResource = locale === 'en' ? null :
			await DeputyResources.loadResource( `i18n/${module}/${locale}.json` )
				.catch( () => {
					// Could not find requested language file.
					return null;
				} );
		if ( !langResource ) {
			return;
		}

		try {
			const langData = JSON.parse( langResource );
			for ( const key in langData ) {
				if ( cloneRegex( match ).test( key ) ) {
					mw.messages.set( key, langData[ key ] );
				}
			}
		} catch ( e ) {
			// Silent failure.
			error( 'Deputy: Requested language page is not a valid JSON file.', e );
		}
	}

}
