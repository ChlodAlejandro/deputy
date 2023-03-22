import '../../../types';
import { blockExit, unblockExit } from '../../../util/blockExit';
import { h } from 'tsx-dom';
import CRFDIntroPageLayout from './pages/CRFDIntroPageLayout';
import CRFDUserSelectPageLayout from './pages/CRFDUserSelectPageLayout';
import sleep from '../../../util/sleep';
import { BackgroundChecks } from '../BackgroundChecks';
import CRFDUserCheckPageLayout from './pages/CRFDUserCheckPageLayout';

let InternalCaseRequestFilingDialog: any;

interface CaseRequestFilingDialogData {
	/**
	 * Extra classes for this dialog.
	 */
	classes?: string[];
}

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

		introPage: ReturnType<typeof CRFDIntroPageLayout>;
		userSelectPage: ReturnType<typeof CRFDUserSelectPageLayout>;
		userCheckPage: ReturnType<typeof CRFDUserCheckPageLayout>;
		layout: typeof window.OO.ui.BookletLayout;

		/**
		 * @param config
		 */
		constructor( config: CaseRequestFilingDialogData ) {
			super( config );
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

			this.layout = new OO.ui.BookletLayout( {} );

			this.layout.addPages( [
				( this.introPage =
					CRFDIntroPageLayout( { dialog: this } ) ),
				( this.userSelectPage =
					CRFDUserSelectPageLayout( { dialog: this } ) ),
				( this.userCheckPage =
					CRFDUserCheckPageLayout( { dialog: this } ) )
			] );

			// Set first page as active
			this.setPage( this.introPage.name, true );

			this.$body.append( this.layout.$element );
		}

		/**
		 * @return which checks are enabled on this wiki.
		 */
		getEnabledChecks(): BackgroundChecks {
			const ccrfConfig = window.CCICaseRequestFiler.wikiConfig.ccrf;
			return {
				page: ccrfConfig.performPageChecks.get() &&
					ccrfConfig.pageDeletionFilters.get() != null,
				revision: ccrfConfig.performRevisionChecks.get() &&
					ccrfConfig.revisionDeletionFilters.get() != null,
				warnings: ccrfConfig.performWarningChecks.get() &&
					ccrfConfig.warningFilters.get() != null
			};
		}

		/**
		 * Check if a page (default: current page) is the first page of this booklet.
		 *
		 * @param pageName
		 * @return A boolean indicating whether the page is the first page.
		 */
		isFirstPage( pageName: string = this.layout.getCurrentPageName() ) {
			return ( Object.keys( this.layout.pages )
				.indexOf( pageName ) ) === 0;
		}

		/**
		 * Check if a page (default: current page) is the last page of this booklet.
		 *
		 * @param pageName
		 * @return A boolean indicating whether the page is the last page.
		 */
		isLastPage( pageName: string = this.layout.getCurrentPageName() ) {
			return ( Object.keys( this.layout.pages )
				.indexOf( pageName ) ) === Object.keys( this.layout.pages ).length - 1;
		}

		/**
		 * Navigate to the previous page.
		 */
		previousPage() {
			this.setPage(
				Object.keys( this.layout.pages )[
					Object.keys( this.layout.pages )
						.indexOf( this.layout.getCurrentPageName() ) - 1
				]
			);
		}

		/**
		 * Navigate to the next page.
		 */
		nextPage() {
			this.setPage(
				Object.keys( this.layout.pages )[
					Object.keys( this.layout.pages )
						.indexOf( this.layout.getCurrentPageName() ) + 1
				]
			);
		}

		/**
		 *
		 * @param name
		 * @param skipAnimation
		 */
		setPage( name: string, skipAnimation = false ) {
			if ( skipAnimation ) {
				this.layout.getCurrentPage()?.$element?.removeClass( 'crfd-page--active' );
				this.layout.setPage( name );
				this.layout.getCurrentPage().$element.addClass( 'crfd-page--active' );
			} else {
				this.layout.getCurrentPage()?.$element?.removeClass( 'crfd-page--active' );
				sleep( 100 ).then( () => {
					this.layout.setPage( name );
					this.layout.getCurrentPage().$element.addClass( 'crfd-page--active' );
				} );
			}
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
 * @param config
 * @return A CaseRequestFilingDialog object
 */
export default function ( config: CaseRequestFilingDialogData = {} ) {
	if ( !InternalCaseRequestFilingDialog ) {
		initCaseRequestFilingDialog();
	}
	return new InternalCaseRequestFilingDialog( config );
}
