/**
 * MediaWiki core contains a lot of quirks in the code. Other extensions
 * also have their own quirks. To prevent these quirks from affecting Deputy's
 * functionality, we need to perform a few hacks.
 */
export default function (): void {

	// This applies the {{int:message}} parser function with "MediaWiki:". This
	// is due to VisualEditor using "MediaWiki:" in message values instead of "int:"
	( mw as any ).jqueryMsg.HtmlEmitter.prototype.mediawiki =
		( mw as any ).jqueryMsg.HtmlEmitter.prototype.int;

	/**
	 * Performs a simple if check. Works just like the Extension:ParserFunctions
	 * version; it checks if the first parameter is blank and returns the second
	 * parameter if true. The latter parameter is passed if false.
	 *
	 * UNLIKE the Extension:ParserFunctions version, this version does not trim
	 * the parameters.
	 *
	 * @see https://www.mediawiki.org/wiki/Help:Extension:ParserFunctions#if
	 * @param nodes
	 * @return see function description
	 */
	( mw as any ).jqueryMsg.HtmlEmitter.prototype.if = function ( nodes: string[] ) {
		return ( nodes[ 0 ].trim() ? ( nodes[ 1 ] ?? '' ) : ( nodes[ 2 ] ?? '' ) );
	};
	// "#if" is unsupported due to the parsing done by jqueryMsg.

	/**
	 * Simple function to avoid parsing errors during message expansion. Drops the "Template:"
	 * prefix before a link.
	 *
	 * @param nodes
	 * @return {{text}}
	 */
	( mw as any ).jqueryMsg.HtmlEmitter.prototype.template = function ( nodes: string[] ) {
		return `{{${nodes.join( '|' )}}}`;
	};
	/**
	 * Allows `{{subst:...}}` to work. Does not actually change anything.
	 *
	 * @param nodes
	 * @return {{text}}
	 */
	( mw as any ).jqueryMsg.HtmlEmitter.prototype.subst = function ( nodes: string[] ) {
		return `{{subst:${nodes.join( '|' )}}}`;
	};

	/**
	 * Works exactly like the localurl magic word. Returns the local href to a page.
	 * Also adds query strings if given.
	 *
	 * @see https://www.mediawiki.org/wiki/Help:Magic_words#URL_data
	 * @param nodes
	 * @return /wiki/{page}?{query}
	 */
	( mw as any ).jqueryMsg.HtmlEmitter.prototype.localurl = function ( nodes: string[] ) {
		return mw.util.getUrl( nodes[ 0 ] ) + '?' + nodes[ 1 ];
	};
}
