import CopiedTemplateEditorDialog from './ui/CopiedTemplateEditorDialog';
import type { Deputy } from '../../Deputy';
import unwrapWidget from '../../util/unwrapWidget';
import CopiedTemplate from './models/CopiedTemplate';

/**
 *
 */
export default class CopiedTemplateEditor {

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
	startButtons: any[];

	/**
	 *
	 * @param deputy
	 */
	constructor( deputy?: Deputy ) {
		this.deputy = deputy;
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
		for ( const button of this.startButtons ) {
			button.setDisabled( state == null ? !button.isDisabled() : !state );
		}
	}

}
