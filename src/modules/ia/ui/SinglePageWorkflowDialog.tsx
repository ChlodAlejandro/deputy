import '../../../types';
import { blockExit, unblockExit } from '../../../util/blockExit';
import normalizeTitle from '../../../wiki/util/normalizeTitle';

export interface SinglePageWorkflowDialogData {
	page: string | mw.Title;
}

let InternalSinglePageWorkflowDialog: any;

/**
 * Initializes the process element.
 */
function initSinglePageWorkflowDialog() {
	InternalSinglePageWorkflowDialog = class SinglePageWorkflowDialog extends OO.ui.ProcessDialog {

		// For dialogs. Remove if not a dialog.
		static static = {
			name: 'iaSinglePageWorkflowDialog',
			title: mw.message( 'deputy.ia' ).text(),
			actions: [
				{
					action: 'close',
					label: mw.message( 'deputy.close' ).text(),
					flags: 'safe'
				}
			]
		};

		page: mw.Title;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: SinglePageWorkflowDialogData ) {
			super();

			this.page = normalizeTitle( config.page );
		}

		/**
		 * @return The body height of this dialog.
		 */
		getBodyHeight(): number {
			return 900;
		}

		/**
		 * Initializes the dialog.
		 */
		initialize() {
			super.initialize();

			this.panelLayout = new OO.ui.PanelLayout( {
				expanded: true,
				framed: true,
				content: [ this.indexLayout ]
			} );

			this.$body.append( this.layout.$element );
		}

		/**
		 * @param data
		 * @return An OOUI Process
		 */
		getSetupProcess( data: any ): any {
			const process = super.getSetupProcess.call( this, data );

			process.next( () => {
				blockExit( 'ia-spwd' );
			} );

			return process;
		}

		/**
		 * @param action
		 * @return An OOUI Process
		 */
		getActionProcess( action: string ): any {
			const process = super.getActionProcess.call( this, action );

			if ( action === 'execute' ) {
				throw new Error( 'Completion function not set.' );
			}
			process.next( function () {
				this.close( { action: action } );
			}, this );

			return process;
		}

		/**
		 * @param data
		 * @return An OOUI Process
		 */
		getTeardownProcess( data: any ): any {
			unblockExit( 'ia-spwd' );
			/** @member any */
			return super.getTeardownProcess.call( this, data );
		}

	};

}

/**
 * Creates a new SinglePageWorkflowDialog.
 *
 * @param config Configuration to be passed to the element.
 * @return A SinglePageWorkflowDialog object
 */
export default function ( config: SinglePageWorkflowDialogData ) {
	if ( !InternalSinglePageWorkflowDialog ) {
		initSinglePageWorkflowDialog();
	}
	return new InternalSinglePageWorkflowDialog( config );
}
