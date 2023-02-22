import '../../../types';
import 'types-mediawiki';

export interface CaseRequestFilingDialogData {

}

let InternalCaseRequestFilingDialog: any;

/**
 * Initializes the process element.
 */
function initCaseRequestFilingDialog() {
	InternalCaseRequestFilingDialog = class CaseRequestFilingDialog extends OO.ui.ProcessDialog {

		// For dialogs. Remove if not a dialog.
		static static = {
			name: 'caseRequestFilingDialog',
			title: mw.msg( 'deputy.caseRequestFilingDialog.title' ),
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
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: CaseRequestFilingDialogData ) {
			super();
			// Perform constructor actions.
		}

	};
}

/**
 * Creates a new CaseRequestFilingDialog.
 *
 * @param config Configuration to be passed to the element.
 * @return A CaseRequestFilingDialog object
 */
export default function ( config: CaseRequestFilingDialogData = {} ) {
	if ( !InternalCaseRequestFilingDialog ) {
		initCaseRequestFilingDialog();
	}
	return new InternalCaseRequestFilingDialog( config );
}
