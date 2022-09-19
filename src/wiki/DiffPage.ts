import getRevisionDiffURL from './util/getRevisionDiffURL';
import FakeDocument from '../models/FakeDocument';
import swapElements from '../util/swapElements';

export interface DiffPageLoadOptions {
	/**
	 * Optional diff to compare with (left side, "old ID")
	 */
	oldid?: number;
}

/**
 *
 */
export default class DiffPage {

	/**
	 * Reloads the current diff page. Takes inspiration from Extension:RevisionSlider.
	 *
	 * @param diff
	 * @param options
	 * @see https://w.wiki/5Roy
	 */
	static async loadNewDiff( diff: number, options: DiffPageLoadOptions = {} ): Promise<void> {
		const diffUrl = getRevisionDiffURL(
			diff,
			options.oldid ?? null,
			true
		);

		const contentText = document.querySelector( '#mw-content-text' );
		contentText.classList.add( 'dp-reloading' );

		const diffDoc = await fetch( diffUrl )
			.then( ( r ) => r.blob(), () => {
				mw.loader.using( [
					'oojs-ui-core', 'oojs-ui-windows'
				], () => {
					OO.ui.alert( mw.msg( 'deputy.session.page.diff.loadFail' ) );
				} );
				return null;
			} )
			.then( ( b ) => b == null ? null : FakeDocument.build( b ) )
			.then( ( d ) => d );

		if ( diffDoc == null ) {
			return;
		}

		const newContentText = diffDoc.document.querySelector( '#mw-content-text' );
		swapElements( contentText, newContentText );

		document.querySelectorAll( '#ca-edit a, #ca-ve-edit a' ).forEach( ( e ) => {
			const newEditUrl = new URL( e.getAttribute( 'href' ) );
			newEditUrl.searchParams.set( 'oldid', `${diff}` );
			e.setAttribute( 'href', newEditUrl.href );
		} );

		// Extract wgDiffOldId from HTML (because JavaScript remains unparsed and oldid
		// (from parameters) might be a null value.
		const oldid = /"wgDiffOldId":\s*(\d+)/g.exec(
			diffDoc.document.head.outerHTML
		)?.[ 1 ];

		// T161257
		mw.config.set( {
			wgRevisionId: diff,
			wgDiffOldId: +oldid,
			wgDiffNewId: diff
		} );

		// Forgetting JQuery ban for now. Backwards-compat reasons.
		mw.hook( 'wikipage.content' ).fire(
			$( newContentText )
		);
		mw.hook( 'wikipage.diff' ).fire(
			$( document.querySelector( 'body > table.diff' ) )
		);

		history.pushState( {}, null, diffUrl );
	}

}
