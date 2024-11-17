/**
 * Handles most recent page visits.
 */
import normalizeTitle from './util/normalizeTitle';
import nsId from './util/nsId';

/**
 *
 */
export default class Recents {

	static readonly key = 'mw-userjs-recents';

	/**
	 * Saves the current page to the local list of most recently visited pages.
	 */
	static save() {
		const page = normalizeTitle();

		if (
			page.getNamespaceId() === nsId( 'special' ) ||
			page.getNamespaceId() === nsId( 'media' )
		) {
			// Don't save virtual namespaces.
			return;
		}

		const pageName = page.getPrefixedText();
		const recentsArray: string[] =
			JSON.parse( window.localStorage.getItem( Recents.key ) ) ?? [];

		if ( recentsArray[ 0 ] === pageName ) {
			// Avoid needless operations.
			return;
		}

		while ( recentsArray.indexOf( pageName ) !== -1 ) {
			recentsArray.splice( recentsArray.indexOf( pageName ), 1 );
		}
		if ( recentsArray.length > 0 ) {
			recentsArray.pop();
		}

		recentsArray.splice( 0, 0, pageName );

		window.localStorage.setItem( Recents.key, JSON.stringify( recentsArray ) );
	}

	/**
	 * @return The most recently visited pages.
	 */
	static get(): string[] {
		return JSON.parse( window.localStorage.getItem( Recents.key ) );
	}

}
