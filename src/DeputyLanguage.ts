import getPageContent from './util/getPageContent';
import deputyEnglish from '../i18n/en.json';

/**
 * Handles internationalization and localization for Deputy and sub-modules.
 */
export default class DeputyLanguage {

	/**
	 * Loads the language for this Deputy interface.
	 */
	static async load() {
		// TODO: The goal is to have Deputy load the file for the current wgUserLanguage.
		// Internationalization
		let stringsLoaded = false;
		if ( window.deputyLang ) {
			if ( typeof window.deputyLang === 'object' ) {
				for ( const key in window.deputyLang ) {
					mw.messages.set( key, window.deputyLang[ key ] );
				}
				stringsLoaded = true;
			} else {
				const langFile = await getPageContent( window.deputyLang );
				try {
					if ( langFile.contentFormat !== 'application/json' ) {
						// Anti-pattern, but JSON.parse throws so this catches both of those.
						// noinspection ExceptionCaughtLocallyJS
						throw new Error( 'Language file is not JSON' );
					}

					const langData = JSON.parse( langFile );
					for ( const key in langData ) {
						mw.messages.set( key, langData[ key ] );
					}
					stringsLoaded = true;
				} catch ( e ) {
					mw.notify(
						'Deputy: Requested language page is not a valid JSON file.',
						{ type: 'error' }
					);
				}
			}
		}

		// Run if (a) no deputyLang set, or (b) language file loading fails
		if ( !stringsLoaded ) {
			for ( const key in deputyEnglish ) {
				mw.messages.set( key, ( deputyEnglish as Record<string, string> )[ key ] );
			}
		}
	}

}
