import { h } from 'tsx-dom';
import { DeputyUIElement } from '../DeputyUIElement';
import DeputyCCIStatusDropdown from '../shared/DeputyCCIStatusDropdown';
import unwrapWidget from '../../util/unwrapWidget';
import { DeputyPageStatusResponseMessage } from '../../DeputyCommunications';
import DeputyCase from '../../wiki/DeputyCase';

/**
 * The DeputyPageToolbar is appended to all pages (outside the mw-parser-output block)
 * that are part of the currently-active case page. It includes the status dropdown,
 * page name, basic case info, and analysis tools.
 *
 * The toolbar automatically connects with an existing session through the use of
 * inter-tab communication (facilitated by DeputyCommunications).
 */
export default class DeputyPageToolbar implements DeputyUIElement {

	originData: DeputyPageStatusResponseMessage;
	row: { casePage: DeputyCase, title: mw.Title };

	revisionCheckbox: any;
	statusDropdown: DeputyCCIStatusDropdown;

	revisionMode: boolean;

	/**
	 * @param originData The data received from a page status request.
	 *   Used to initialize some values.
	 */
	constructor( originData: DeputyPageStatusResponseMessage ) {
		this.originData = originData;
		this.revisionMode = originData.revisionStatus != null;
	}

	/**
	 * @inheritDoc
	 */
	async prepare(): Promise<void> {
		this.row = {
			casePage: await DeputyCase.build( this.originData.caseId ),
			title: window.deputy.currentPage
		};
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		if ( this.revisionMode ) {
			this.revisionCheckbox = new OO.ui.CheckboxInputWidget( {
				classes: [ 'dp-pt-completedCheckbox' ],
				label: mw.message( 'deputy.session.revision.assessed' ).text()
			} );
		}

		this.statusDropdown = new DeputyCCIStatusDropdown( this.row, {
			status: this.originData.status,
			enabled: this.originData.enabledStatuses
		} );

		this.statusDropdown.addEventListener( 'updateFail', () => {
			OO.ui.alert( mw.message( 'deputy.session.page.incommunicable' ).text() );
		} );

		return <div class="deputy dp-pageToolbar">
			{ unwrapWidget( this.statusDropdown.dropdown ) }
			<div class="dp-pt-caseInfo">
				<div class="dp-pt-caseInfo-label">{
					mw.message( 'deputy.session.page.caseInfo.label' ).text()
				}</div>
				<a class="dp-pt-caseInfo-name">{
					this.row.casePage.getCaseName()
				}</a>
			</div>
			{ this.revisionMode && <div class="dp-pt-separator">&#8203;</div> }
			{ this.revisionMode && unwrapWidget( this.revisionCheckbox ) }
		</div> as HTMLElement;
	}

}
