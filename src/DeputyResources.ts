import getPageContent from './util/getPageContent';

interface WikiResourceRoot {
	type: 'wiki';
	/**
	 * A URL to a wiki's `api.php` to use for loading languages. This is used in
	 * conjunction with `pagespaceRoot` below to load languages (with {@link DeputyLanguage}).
	 *
	 * This must point to an `api.php` or requests will fail. The `origin` field when accessing
	 * this API will always be set to `*`, which will disable user-specific data. Ensure that
	 * the pagespace root is accessible through the API (not view-protected nor deleted).
	 */
	wiki: URL;
	/**
	 * The root of the Deputy "pagespace". This is a set of pages prefixed by a common prefix
	 * (the value of this field). The structure of the pages under this prefix must match the
	 * standard resource root structure, but as wiki pages with `/` delimiting directories.
	 * A slash is appended if one was not provided.
	 *
	 * This is used as the prefix to resource requests. For example, if the prefix is
	 * set to `MediaWiki:Gadget-deputy/`, a request for `i18n/en.json` will be made to
	 * `MediaWiki:Gadget-deputy/i18n/en.json`.
	 */
	prefix: string;
}

interface StandardResourceRoot {
	type: 'url';
	/**
	 * An HTTP URL to a directory. When constructing the URL for this, ensure that the input
	 * string ends with `/`, or else the last part of the path will be overwritten by
	 * later uses of the resource root.
	 */
	url: URL;
}

export type ResourceRoot = WikiResourceRoot | StandardResourceRoot;

/**
 * Handles resource fetching operations.
 */
export class DeputyResources {

	/**
	 * The root of all Deputy resources. This should serve static data that Deputy will
	 * use to load resources such as language files.
	 */
	static readonly root: ResourceRoot = {
		type: 'url',
		url: new URL( 'https://zoomiebot.toolforge.org/deputy/' )
	};

	/**
	 * A `mw.ForeignApi` for accessing a wiki resource root. If the resource root is not
	 * a wiki, this remains unset.
	 */
	static api: mw.ForeignApi;

	/**
	 * Loads a resource from the provided resource root.
	 *
	 * @param path A path relative to the resource root.
	 * @return A Promise that resolves to the resource's content as a UTF-8 string.
	 */
	static async loadResource( path: string ): Promise<string> {
		switch ( this.root.type ) {
			case 'url': {
				const headers = new Headers();
				headers.set( 'Origin', window.location.origin );
				return fetch( ( new URL( path, this.root.url ) ).href, {
					method: 'GET',
					headers
				} ).then( ( r ) => r.text() );
			}
			case 'wiki': {
				this.assertApi();
				return getPageContent(
					this.root.prefix.replace( /\/$/, '' ) + '/' + path,
					{},
					this.api
				);
			}
		}
	}

	/**
	 * Ensures that `this.api` is a valid ForeignApi.
	 */
	static assertApi(): void {
		if ( this.root.type !== 'wiki' ) {
			return;
		}
		if ( !this.api ) {
			this.api = new mw.ForeignApi( this.root.wiki.toString(), {
				// Force anonymous mode. Deputy doesn't need user data anyway,
				// so this should be fine.
				anonymous: true
			} );
		}
	}

}
