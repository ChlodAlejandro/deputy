import CopiedTemplateEditor from './CopiedTemplateEditor';
import DeputyLanguage from '../../DeputyLanguage';

/**
 * This function handles CTE loading when Deputy isn't present. When Deputy is not
 * present, the following must be done on our own:
 * (1) Instantiate an OOUI WindowManager
 * (2) Load language strings
 *
 * This function accomplishes exactly those.
 *
 * @param window
 */
( async ( window: Window & { CopiedTemplateEditor?: CopiedTemplateEditor } ) => {

	await DeputyLanguage.load();

	window.CopiedTemplateEditor = new CopiedTemplateEditor();
	window.CopiedTemplateEditor.startButtons = [];

	if (
		// Button not yet appended
		document.getElementById( 'pt-cte' ) == null &&
		// Not ephemeral namespace
		mw.config.get( 'wgNamespaceNumber' ) >= 0
	) {
		mw.util.addPortletLink(
			'p-tb',
			'#',
			'{{copied}} Template Editor',
			'pt-cte'
		).addEventListener( 'click', function ( event ) {
			event.preventDefault();
			window.CopiedTemplateEditor.toggleButtons( false );
			window.CopiedTemplateEditor.openEditDialog();
		} );
	}

	mw.loader.using(
		[ 'oojs-ui-core', 'oojs-ui.styles.icons-editing-core' ],
		() => {
			// Only run if this script wasn't loaded using the loader.
			if ( !window.CopiedTemplateEditor || !window.CopiedTemplateEditor.loader ) {
				mw.hook( 'wikipage.content' ).add( () => {
					// Find all {{copied}} templates and append our special button.
					// This runs on the actual document, not the Parsoid document.
					document.querySelectorAll( '.copiednotice > tbody > tr' )
						.forEach( ( e ) => {
							if ( e.classList.contains( 'cte-upgraded' ) ) {
								return;
							}
							e.classList.add( 'cte-upgraded' );

							const startButton = new OO.ui.ButtonWidget( {
								icon: 'edit',
								title: 'Modify {{copied}} notices for this page',
								label: 'Modify copied notices for this page'
							} ).setInvisibleLabel( true );
							window.CopiedTemplateEditor.startButtons.push( startButton );
							const td = document.createElement( 'td' );
							td.style.paddingRight = '0.9em';
							td.appendChild( startButton.$element[ 0 ] );
							e.appendChild( td );

							startButton.on( 'click', () => {
								window.CopiedTemplateEditor.toggleButtons( false );
								window.CopiedTemplateEditor.openEditDialog();
							} );
						} );
				} );

				// Query parameter-based autostart
				if (
					/[?&]cte-autostart(=(1|yes|true|on)?(&|$)|$)/.test( window.location.search )
				) {
					window.CopiedTemplateEditor.toggleButtons( false );
					window.CopiedTemplateEditor.openEditDialog();
				}
			}
		}
	);

} )( window );
