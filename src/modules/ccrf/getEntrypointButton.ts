import log from '../../util/log';
import dynamicModuleLoad from '../dynamicModuleLoad';
// #if _DEV
import dynamicDevModuleLoad from '../dynamicDevModuleLoad';
// #endif _DEV

/**
 * Gets the OOUI ButtonWidget which starts the filer's main workflow dialog. Can
 * be used within a loader or standalone context.
 */
export async function getEntrypointButton(): Promise<any> {
	return new Promise( ( res ) => mw.loader.using( [
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
						log( e );
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
						log( e );
						OO.ui.alert( mw.msg( 'deputy.module.loadFailure', e.message ) );
					} );
				// #endif _DEV
			}
		} );

		window.ccrfEntrypoint = appendEntrypointButton;
		res( appendEntrypointButton );
	} ) );
}
