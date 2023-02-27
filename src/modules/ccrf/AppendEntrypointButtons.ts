import dynamicModuleLoad from '../dynamicModuleLoad';
import last from '../../util/last';
import getSectionElements from '../../wiki/util/getSectionElements';
import unwrapWidget from '../../util/unwrapWidget';
// #if _DEV
import dynamicDevModuleLoad from '../dynamicDevModuleLoad';
// #endif _DEV

/**
 * Appends CCRF entrypoint buttons to the DOM.
 *
 * @param requestsHeader The header of the requests section within rendered HTML.
 */
export function appendEntrypointButtons( requestsHeader: HTMLElement ): void {
	mw.loader.using( [
		'oojs-ui-core',
		'oojs-ui-windows',
		'oojs-ui.styles.icons-content',
		'mediawiki.util',
		'mediawiki.api'
	], () => {
		const appendEntrypointButton = new OO.ui.ButtonWidget( {
			icon: 'articleAdd',
			classes: [ 'deputy-ccrf-entrypoint' ],
			label: mw.msg( 'deputy.ccrf.start' ),
			flags: [ 'progressive' ]
		} );

		appendEntrypointButton.on( 'click', () => {
			if ( window.CCICaseRequestFiler ) {
				window.CCICaseRequestFiler.openWorkflowDialog();

			} else {
				// #if _DEV
				dynamicDevModuleLoad( 'ccrf' )
					.then( () => {
						mw.hook( 'ccrf.postload' ).add( () => {
							window.CCICaseRequestFiler.openWorkflowDialog();
						} );
					} )
					.catch( ( e ) => {
						console.log( e );
						OO.ui.alert( mw.msg( 'deputy.module.loadFailure', e.message ) );
					} );
				// #else
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
				// #endif _DEV
			}
		} );

		window.ccrfEntrypoint = appendEntrypointButton;
		last( getSectionElements( requestsHeader ) ).insertAdjacentElement(
			'afterend', unwrapWidget( appendEntrypointButton )
		);
	} );
}
