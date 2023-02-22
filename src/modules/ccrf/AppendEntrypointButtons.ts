import dynamicModuleLoad from '../dynamicModuleLoad';
import last from '../../util/last';
import getSectionElements from '../../wiki/util/getSectionElements';
import unwrapWidget from '../../util/unwrapWidget';

/**
 * Appends CCRF entrypoint buttons to the DOM.
 *
 * @param requestsHeader The header of the requests section within rendered HTML.
 */
export function appendEntrypointButtons( requestsHeader: HTMLElement ): void {
	mw.loader.using( [
		'oojs-ui-core',
		'oojs-ui-windows',
		'mediawiki.util',
		'mediawiki.api'
	], () => {
		const appendEntrypointButton = new OO.ui.ButtonWidget( {
			classes: [ 'deputy-ccrf-entrypoint' ],
			label: mw.msg( 'deputy.ccrf.start' ),
			flags: [ 'progressive' ]
		} );

		appendEntrypointButton.on( 'click', () => {
			if ( window.CCICaseRequestFiler ) {
				window.CCICaseRequestFiler.openWorkflowDialog();
			} else {
				dynamicModuleLoad( 'CCICaseRequestFiler' )
					.then( () => {
						mw.hook( 'ccrf.postload' ).add( () => {
							window.CCICaseRequestFiler.openWorkflowDialog();
						} );
					} )
					.catch( ( e ) => {
						console.log( e );
						OO.ui.alert( mw.msg( 'deputy.module.loadFailure', e.message ) );
					} );
			}
		} );

		window.ccrfEntrypoint = appendEntrypointButton;
		last( getSectionElements( requestsHeader ) ).insertAdjacentElement(
			'afterend', unwrapWidget( appendEntrypointButton )
		);
	} );
}
