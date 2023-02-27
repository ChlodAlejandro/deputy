import '../../../types';
import 'types-mediawiki';
import { blockExit, unblockExit } from '../../../util/blockExit';
import { h } from 'tsx-dom';

let InternalCaseRequestFilingDialog: any;

/**
 * Initializes the process element.
 */
function initCaseRequestFilingDialog() {
	InternalCaseRequestFilingDialog = class CaseRequestFilingDialog extends OO.ui.ProcessDialog {

		// For dialogs. Remove if not a dialog.
		static static = {
			name: 'caseRequestFilingDialog',
			title: mw.msg( 'deputy.ccrf.caseRequestFilingDialog.title' ),
			actions: [
				{
					action: 'close',
					label: mw.msg( 'deputy.close' ),
					flags: 'safe'
				}
			]
		};

		data: any;

		/**
		 */
		constructor() {
			super();
		}

		/**
		 * @return The body height of this dialog.
		 */
		getBodyHeight(): number {
			return 500;
		}

		/**
		 * Initializes the dialog.
		 */
		initialize() {
			super.initialize();
			this.$body.append( new OO.ui.PanelLayout( {
				expanded: false,
				framed: false,
				padded: true,
				content: [
					// this.render()
				]
			} ).$element );
		}

		/**
		 * @param data
		 * @return An OOUI Process
		 */
		getSetupProcess( data: any ): any {
			const process = super.getSetupProcess.call( this, data );

			process.next( () => {
				blockExit( 'ccrf-new' );
			} );

			return process;
		}

		/**
		 * @param action
		 * @return An OOUI Process
		 */
		getActionProcess( action: string ): any {
			const process = super.getActionProcess.call( this, action );

			process.next( function () {
				unblockExit( 'ccrf-new' );
				this.close( { action: action } );
			}, this );

			process.next( function () {
				window.ccrfEntrypoint?.setDisabled( false );
			} );

			return process;
		}

		/**
		 * @param data
		 * @return An OOUI Process
		 */
		getTeardownProcess( data: any ): any {
			/** @member any */
			return super.getTeardownProcess.call( this, data );
		}

	};
}

/**
 * Creates a new CaseRequestFilingDialog.
 *
 * @return A CaseRequestFilingDialog object
 */
export default function () {
	if ( !InternalCaseRequestFilingDialog ) {
		initCaseRequestFilingDialog();
	}
	return new InternalCaseRequestFilingDialog();
}
