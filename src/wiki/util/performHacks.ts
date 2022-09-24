/**
 * MediaWiki core contains a lot of quirks in the code. Other extensions
 * also have their own quirks. To prevent these quirks from affecting Deputy's
 * functionality, we need to perform a few hacks.
 */
export default function (): void {

	// This applies the {{int:message}} parser function with "MediaWiki:". This
	// is due to VisualEditor using "MediaWiki:" in message values instead of "int:"
	( mw as any ).jqueryMsg.HtmlEmitter.prototype.mediawiki =
	( mw as any ).jqueryMsg.HtmlEmitter.prototype.mediaWiki =
	( mw as any ).jqueryMsg.HtmlEmitter.prototype.Mediawiki =
	( mw as any ).jqueryMsg.HtmlEmitter.prototype.MediaWiki =
		( mw as any ).jqueryMsg.HtmlEmitter.prototype.int;

	( mw as any ).jqueryMsg.HtmlEmitter.prototype.if = function ( nodes: string[] ) {
		return nodes[ 0 ] ? nodes[ 1 ] : nodes[ 2 ];
	};
}
