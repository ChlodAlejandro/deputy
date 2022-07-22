import CopiedTemplateEditorDialog from './ui/CopiedTemplateEditorDialog';
import type { Deputy } from '../../Deputy';
import unwrapWidget from '../../util/unwrapWidget';
import CopiedTemplate from './models/CopiedTemplate';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cteStyles from './css/copied-template-editor.css';

declare global {
	interface Window {
		CopiedTemplateEditor?: CopiedTemplateEditor;
	}
}

/**
 * Main class for CopiedTemplateEditor.
 */
export default class CopiedTemplateEditor {

	readonly CopiedTemplate = CopiedTemplate;

	/**
	 * An instance of Deputy. This is commonly `window.deputy`. Instantiating this class
	 * with a Deputy instances enables connection with the Deputy core, which shares the
	 * OOUI window manager for Deputy.
	 */
	readonly deputy?: Deputy;
	/**
	 * An OOUI WindowManager. If this class is instantiated standalone (without Deputy),
	 * this will be a set value.
	 */
	_windowManager: any;

	/**
	 * The `loader` variable is set (in JavaScript) by a CTE loader. This prevents UI
	 * elements (such as "start" buttons and the toolbox link) from being appended
	 * to the DOM twice.
	 */
	loader?: boolean;

	/**
	 * Whether the core has been loaded or not. Set to `true` here, since this is
	 * obviously the core class.
	 */
	loaded = true;
	/**
	 * Determines the start state of the start buttons. This depends on `toggleButtons`.
	 */
	startState: boolean;
	/**
	 * Pencil icon buttons on {{copied}} templates that open CTE.
	 */
	startButtons: any[] = [];

	/**
	 * @return The responsible window manager for this class.
	 */
	get windowManager(): any {
		if ( !this.deputy ) {
			if ( !this._windowManager ) {
				this._windowManager = new OO.ui.WindowManager();
				document.body.appendChild( unwrapWidget( this._windowManager ) );
			}
			return this._windowManager;
		} else {
			return this.deputy.windowManager;
		}
	}

	/**
	 *
	 * @param deputy
	 */
	constructor( deputy?: Deputy ) {
		this.deputy = deputy;
	}

	/**
	 * Perform actions that run *before* CTE starts (prior to execution). This involves
	 * adding in necessary UI elements that serve as an entry point to CTE.
	 */
	preInit(): void {
		if (
			// Button not yet appended
			document.getElementById( 'pt-cte' ) == null &&
			// Not ephemeral namespace
			mw.config.get( 'wgNamespaceNumber' ) >= 0
		) {
			mw.util.addPortletLink(
				'p-tb',
				'#',
				mw.message( 'deputy.cte' ).text(),
				'pt-cte'
			).addEventListener( 'click', ( event ) => {
				event.preventDefault();
				if (
					!( event.currentTarget as HTMLElement )
						.hasAttribute( 'disabled' )
				) {
					this.toggleButtons( false );
					this.openEditDialog();
				}
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
									title: mw.message( 'deputy.cte.edit' ).text(),
									label: mw.message( 'deputy.cte.edit' ).text()
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
				}
			}
		);

		this.startState = true;
	}

	/**
	 * Opens the Copied Template Editor dialog.
	 */
	openEditDialog() {
		mw.loader.using( [
			'oojs-ui-core',
			'oojs-ui-windows',
			'oojs-ui-widgets',
			'oojs-ui.styles.icons-editing-core',
			'oojs-ui.styles.icons-editing-advanced',
			'oojs-ui.styles.icons-interactions',
			'ext.visualEditor.moduleIcons',
			'mediawiki.util',
			'mediawiki.api',
			'mediawiki.Title',
			'mediawiki.widgets',
			'mediawiki.widgets.datetime',
			'jquery.makeCollapsible'
		], () => {
			mw.util.addCSS( cteStyles );

			// The following classes are used here:
			// * deputy
			// * copied-template-editor
			const dialog = CopiedTemplateEditorDialog( {
				main: this,
				classes: [
					// Attach "deputy" class if Deputy.
					this.deputy ? 'deputy' : null,
					'copied-template-editor'
				].filter( ( v ) => !!v )
			} );
			this.windowManager.addWindows( [ dialog ] );
			this.windowManager.openWindow( dialog );
		} );
	}

	/**
	 * Toggle the edit buttons.
	 *
	 * @param state The new state.
	 */
	toggleButtons( state?: boolean ) {
		this.startState = state ?? !( this.startState || false );

		for ( const button of this.startButtons ) {
			button.setDisabled( state == null ? !button.isDisabled() : !state );
		}
		document.getElementById( '.pt-cte a' )
			?.toggleAttribute( 'disabled', state );
	}

}
