import { h } from 'tsx-dom';
import { DeputyUIElement } from '../DeputyUIElement';
import DeputyCCIStatusDropdown from '../shared/DeputyCCIStatusDropdown';
import unwrapWidget from '../../util/unwrapWidget';
import DeputyCase from '../../wiki/DeputyCase';
import removeElement from '../../util/removeElement';
import {
	DeputyMessageEvent,
	DeputyPageStatusResponseMessage,
	DeputyRevisionStatusUpdateMessage
} from '../../DeputyCommunications';
import generateId from '../../util/generateId';

export interface DeputyPageToolbarOptions extends Omit<DeputyPageStatusResponseMessage, 'type'> {
	/**
	 * Whether to force showing the "revision" section even without a revision. This
	 * is used post-render, when the toolbar is already in the DOM, and the use switches
	 * away to a different diff that is not in the scope of the page. Tools will be
	 * accessible, but the revision completion checkbox will not be shown.
	 */
	forceRevision?: boolean;
}

/**
 * The DeputyPageToolbar is appended to all pages (outside the mw-parser-output block)
 * that are part of the currently-active case page. It includes the status dropdown,
 * page name, basic case info, and analysis tools.
 *
 * The toolbar automatically connects with an existing session through the use of
 * inter-tab communication (facilitated by DeputyCommunications).
 */
export default class DeputyPageToolbar implements DeputyUIElement {

	options: DeputyPageToolbarOptions;
	row: { casePage: DeputyCase, title: mw.Title };

	element: HTMLElement;
	revisionCheckbox: any;
	statusDropdown: DeputyCCIStatusDropdown;
	nextRevisionButton: any;

	/**
	 * The revision ID that this toolbar is associated with.
	 */
	revision: number;

	readonly instanceId = generateId();
	readonly revisionStatusUpdateListener = this.onRevisionStatusUpdate.bind( this );

	/**
	 * @param options The data received from a page status request.
	 *   Used to initialize some values.
	 */
	constructor( options: DeputyPageToolbarOptions ) {
		this.options = options;

		if ( options.revisionStatus != null ) {
			this.revision = mw.config.get( 'wgRevisionId' );
		}
	}

	/**
	 * @inheritDoc
	 */
	async prepare(): Promise<void> {
		this.row = {
			casePage: await DeputyCase.build( this.options.caseId ),
			title: window.deputy.currentPage
		};
	}

	/**
	 * Instantiates a DeputyCCIStatusDropdown and returns the HTML element for it.
	 *
	 * @return The OOUI dropdown's HTMLElement
	 */
	renderStatusDropdown(): JSX.Element {
		this.statusDropdown = new DeputyCCIStatusDropdown( this.row, {
			status: this.options.status,
			enabled: this.options.enabledStatuses
		} );

		this.statusDropdown.addEventListener( 'updateFail', () => {
			OO.ui.alert( mw.message( 'deputy.session.page.incommunicable' ).text() );
		} );

		return unwrapWidget( this.statusDropdown.dropdown );
	}

	/**
	 * Renders the "current case" section on the toolbar.
	 *
	 * @return The "current case" section
	 */
	renderCaseInfo(): JSX.Element {
		return <div class="dp-pt-section">
			<div class="dp-pt-section-label">{
				mw.message( 'deputy.session.page.caseInfo.label' ).text()
			}</div>
			<a class="dp-pt-section-content dp-pt-caseInfo">{
				this.row.casePage.getCaseName()
			}</a>
		</div>;
	}

	/**
	 * Renders the "revision" section on the toolbar.
	 *
	 * @return The "Revision #XXXXXXXXXX" section
	 */
	renderRevisionInfo(): JSX.Element {
		if ( this.revision == null ) {
			if ( this.options.forceRevision ?? true ) {
				return this.renderMissingRevisionInfo();
			} else {
				return null;
			}
		}

		this.revisionCheckbox = new OO.ui.CheckboxInputWidget( {
			label: mw.message( 'deputy.session.revision.assessed' ).text()
		} );

		let lastStatus = this.revisionCheckbox.isSelected();
		let processing = false;
		let incommunicable = false;
		this.revisionCheckbox.on( 'change', async ( selected: boolean ) => {
			if ( incommunicable ) {
				incommunicable = false;
				return;
			} else if ( processing ) {
				return;
			}

			processing = true;
			const response = await window.deputy.comms.sendAndWait( {
				type: 'revisionStatusUpdate',
				caseId: this.row.casePage.pageId,
				page: this.row.title.getPrefixedText(),
				revision: this.revision,
				status: selected
			} );

			if ( response == null ) {
				OO.ui.alert( mw.message( 'deputy.session.page.incommunicable' ).text() );
				// Sets flag to avoid running this listener twice.
				incommunicable = true;
				this.revisionCheckbox.setSelected( lastStatus );
			} else {
				// Replace the last status for "undo".
				lastStatus = this.revisionCheckbox.isSelected();
			}
			processing = false;
		} );
		window.deputy.comms.addEventListener(
			'revisionStatusUpdate', this.revisionStatusUpdateListener
		);

		return <div class="dp-pt-section">
			<div class="dp-pt-section-label">{
				mw.message(
					'deputy.session.page.caseInfo.revision',
					`${this.revision}`
				).text()
			}</div>
			<div class="dp-pt-section-content">
				{ unwrapWidget( new OO.ui.FieldLayout(
					this.revisionCheckbox,
					{
						align: 'inline',
						label: mw.message( 'deputy.session.page.caseInfo.assessed' ).text()
					}
				) ) }
			</div>
		</div>;
	}

	/**
	 * Replaces `renderRevisionInfo` if a revision does not exist. Placeholder to
	 * allow tools to be used anyway, even without having an active revision associated.
	 *
	 * @return The "Revision out of scope" section
	 */
	renderMissingRevisionInfo(): JSX.Element {
		const helpPopup = new OO.ui.PopupButtonWidget( {
			icon: 'info',
			framed: false,
			label: mw.message( 'deputy.moreInfo' ).text(),
			invisibleLabel: true,
			popup: {
				head: true,
				padded: true,
				label: mw.message( 'deputy.moreInfo' ).text(),
				align: 'forwards'
			}
		} );
		unwrapWidget( helpPopup ).querySelector( '.oo-ui-popupWidget-body' )
			.appendChild( <p>
				{ mw.message( 'deputy.session.page.caseInfo.revision.help' ).text() }
			</p> );

		return <div class="dp-pt-section">
			<div class="dp-pt-section-label">
				{ mw.message( 'deputy.session.page.caseInfo.revision.none' ).text() }
			</div>
			<div class="dp-pt-section-content dp-pt-missingRevision">
				{ unwrapWidget( helpPopup ) }
			</div>
		</div>;
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		return this.element = <div class="deputy dp-pageToolbar">
			{ this.renderStatusDropdown() }
			{ this.renderCaseInfo() }
			{ this.renderRevisionInfo() }
		</div> as HTMLElement;
	}

	/**
	 * Performs cleanup and removes the element from the DOM.
	 */
	close(): void {
		window.deputy.comms.removeEventListener(
			'revisionStatusUpdate', this.revisionStatusUpdateListener
		);
		this.statusDropdown.close();
		removeElement( this.element );
	}

	/**
	 * Listener for revision status updates from the root session.
	 *
	 * @param root0
	 * @param root0.data
	 */
	onRevisionStatusUpdate(
		{ data }: DeputyMessageEvent<DeputyRevisionStatusUpdateMessage>
	): void {
		if (
			this.row.casePage.pageId === data.caseId &&
			this.row.title.getPrefixedText() === data.page &&
			this.revision === data.revision &&
			this.revisionCheckbox.isSelected() !== data.status
		) {
			this.revisionCheckbox.setSelected( data.status );
		}
	}

}
