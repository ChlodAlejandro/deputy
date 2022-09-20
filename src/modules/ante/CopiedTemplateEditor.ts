import CopiedTemplateEditorDialog from './ui/CopiedTemplateEditorDialog';
import CopiedTemplate from './models/templates/CopiedTemplate';
import deputyAnteEnglish from '../../../i18n/ante/en.json';
import WikiAttributionNotices from './models/WikiAttributionNotices';
import DeputyModule from '../DeputyModule';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import cteStyles from './css/copied-template-editor.css';
import DeputyLanguage from '../../DeputyLanguage';
import deputySharedEnglish from '../../../i18n/shared/en.json';

declare global {
	interface Window {
		CopiedTemplateEditor?: CopiedTemplateEditor;
	}
}

/**
 * Main class for CopiedTemplateEditor.
 */
export default class CopiedTemplateEditor extends DeputyModule {

	static readonly dependencies = [
		'moment',
		'oojs-ui-core',
		'oojs-ui-windows',
		'oojs-ui-widgets',
		'oojs-ui.styles.icons-accessibility',
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
	];

	readonly static = CopiedTemplateEditor;
	readonly CopiedTemplate = CopiedTemplate;

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
	 * The CopiedTemplateEditorDialog. The face of the operation.
	 */
	dialog: any;

	/**
	 * @inheritDoc
	 */
	getName(): string {
		return 'ante';
	}

	/**
	 * Perform actions that run *before* CTE starts (prior to execution). This involves
	 * adding in necessary UI elements that serve as an entry point to CTE.
	 */
	async preInit(): Promise<boolean> {
		if ( !await super.preInit( deputyAnteEnglish ) ) {
			return false;
		}
		await Promise.all( [
			DeputyLanguage.load( 'shared', deputySharedEnglish ),
			DeputyLanguage.loadMomentLocale()
		] );

		if (
			// Button not yet appended
			document.getElementById( 'pt-cte' ) == null &&
			// Not virtual namespace
			mw.config.get( 'wgNamespaceNumber' ) >= 0
		) {
			mw.util.addPortletLink(
				'p-tb',
				'#',
				// Messages used here:
				// * deputy.ante
				// * deputy.ante.short
				// * deputy.ante.acronym
				mw.msg( {
					full: 'deputy.ante',
					short: 'deputy.ante.short',
					acronym: 'deputy.ante.acronym'
				}[ this.config.core.portletNames.get() ] ),
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
						document.querySelectorAll(
							[
								'copiednotice', 'box-split-article', 'box-merged-from',
								'box-merged-to', 'box-backwards-copy', 'box-translated-page'
							].map(
								( v ) => `.${v} > tbody > tr`
							).join( ', ' )
						)
							.forEach( ( e ) => {
								if ( e.classList.contains( 'cte-upgraded' ) ) {
									return;
								}
								e.classList.add( 'cte-upgraded' );

								const startButton = new OO.ui.ButtonWidget( {
									icon: 'edit',
									title: mw.msg( 'deputy.ante.edit' ),
									label: mw.msg( 'deputy.ante.edit' )
								} ).setInvisibleLabel( true );
								this.startButtons.push( startButton );
								const td = document.createElement( 'td' );
								td.style.paddingRight = '0.9em';
								td.appendChild( startButton.$element[ 0 ] );
								e.appendChild( td );

								startButton.on( 'click', () => {
									this.toggleButtons( false );
									this.openEditDialog();
								} );
							} );
					} );
				}
			}
		);

		this.startState = true;

		// Query parameter-based autostart
		if ( /[?&]cte-autostart(=(1|yes|true|on)?(&|$)|$)/.test( window.location.search ) ) {
			this.toggleButtons( false );
			this.openEditDialog();
		}
		return true;
	}

	/**
	 * Opens the Copied Template Editor dialog.
	 */
	openEditDialog() {
		mw.loader.using( CopiedTemplateEditor.dependencies, async () => {
			OO.ui.WindowManager.static.sizes.huge = {
				width: 1100
			};
			mw.util.addCSS( cteStyles );
			await WikiAttributionNotices.init();

			if ( !this.dialog ) {
				// The following classes are used here:
				// * deputy
				// * copied-template-editor
				this.dialog = CopiedTemplateEditorDialog( {
					main: this,
					classes: [
						// Attach "deputy" class if Deputy.
						this.deputy ? 'deputy' : null,
						'copied-template-editor'
					].filter( ( v ) => !!v )
				} );
				this.windowManager.addWindows( [ this.dialog ] );
			}
			this.windowManager.openWindow( this.dialog );
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
