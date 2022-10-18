import { DeputyUIElement } from '../DeputyUIElement';
import { ContributionSurveyRevision } from '../../models/ContributionSurveyRevision';
import { h } from 'tsx-dom';
import unwrapWidget from '../../util/unwrapWidget';
import { DeputyMessageEvent, DeputyRevisionStatusUpdateMessage } from '../../DeputyCommunications';
import type DeputyContributionSurveyRow from './DeputyContributionSurveyRow';
import {
	ChangesListBytes, ChangesListDate,
	ChangesListDiff,
	ChangesListLinks,
	ChangesListTags, ChangesListTime,
	ChangesListUser,
	NewPageIndicator
} from './DeputyChangesListElements';

/**
 * A specific revision for a section row.
 */
export default class DeputyContributionSurveyRevision
	extends EventTarget implements DeputyUIElement {

	disabled: boolean;
	/**
	 * The revision that this UI element handles.
	 */
	revision: ContributionSurveyRevision;
	/**
	 * The row that this revision belongs to.
	 */
	uiRow: DeputyContributionSurveyRow;

	/**
	 * @return `true` the current revision has been checked by the user or `false` if not.
	 */
	get completed(): boolean {
		return this.completedCheckbox?.isSelected() ?? false;
	}
	/**
	 * Set the value of the completed checkbox.
	 *
	 * @param value The new value
	 */
	set completed( value: boolean ) {
		this.completedCheckbox?.setSelected( value );
	}

	/**
	 * @return The hash used for autosave keys
	 */
	get autosaveHash(): string {
		return `CASE--${
			this.uiRow.row.casePage.title.getPrefixedDb()
		}+PAGE--${
			this.uiRow.row.title.getPrefixedDb()
		}+REVISION--${
			this.revision.revid
		}`;
	}

	/**
	 * A function (throttled with `mw.util.throttle`) that saves the current row's status
	 * and comments to DeputyStorage to recover unsaved data or data that could not be saved
	 * (e.g. status when some revisions remain unassessed).
	 */
	statusAutosaveFunction: () => void;
	readonly revisionStatusUpdateListener = this.onRevisionStatusUpdate.bind( this );

	/**
	 * The checkbox to indicate that a diff has been checked by the user.
	 *
	 * @private
	 */
	private completedCheckbox: any;

	/**
	 * @param revision
	 * @param row
	 */
	constructor( revision: ContributionSurveyRevision, row: DeputyContributionSurveyRow ) {
		super();
		this.revision = revision;
		this.uiRow = row;

		if ( this.statusAutosaveFunction == null ) {
			this.statusAutosaveFunction = ( mw.util as any ).throttle( async () => {
				await this.saveStatus();
			}, 500 );
		}
	}

	/**
	 * Save the status and comment for this row to DeputyStorage.
	 */
	async saveStatus(): Promise<void> {
		if ( this.completed ) {
			await window.deputy.storage.db.put( 'diffStatus', {
				hash: this.autosaveHash
			} );
		} else {
			await window.deputy.storage.db.delete( 'diffStatus', this.autosaveHash );
		}
	}

	/**
	 * Gets the database-saved status. Used for getting the autosaved values of the status and
	 * closing comments.
	 */
	async getSavedStatus(): Promise<boolean> {
		return ( await window.deputy.storage.db.get(
			'diffStatus', this.autosaveHash
		) ) != null;
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
			this.uiRow.row.casePage.pageId === data.caseId &&
			this.uiRow.row.title.getPrefixedText() === data.page &&
			this.revision.revid === data.revision
		) {
			this.completed = data.status;
			window.deputy.comms.reply( data, {
				type: 'acknowledge'
			} );
		}
	}

	/**
	 * Performs cleanup before removal.
	 */
	close(): void {
		window.deputy.comms.removeEventListener(
			'revisionStatusUpdate',
			this.revisionStatusUpdateListener
		);
	}

	/**
	 * Prepares the completed checkbox (and preload it with a check if it's been saved in
	 * the cache).
	 */
	async prepare(): Promise<void> {
		this.completedCheckbox = new OO.ui.CheckboxInputWidget( {
			label: mw.msg( 'deputy.session.revision.assessed' ),
			selected: await this.getSavedStatus()
		} );

		this.completedCheckbox.on( 'change', ( checked: boolean ) => {
			this.dispatchEvent( new CustomEvent( 'update', {
				detail: {
					checked: checked,
					revision: this.revision
				}
			} ) );
			window.deputy.comms.send( {
				type: 'revisionStatusUpdate',
				caseId: this.uiRow.row.casePage.pageId,
				page: this.uiRow.row.title.getPrefixedText(),
				revision: this.revision.revid,
				status: checked,
				nextRevision: this.uiRow.revisions?.find(
					( revision ) => !revision.completed
				)?.revision.revid ?? null
			} );
			this.statusAutosaveFunction();
		} );
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		const commentElement = <span
			class="comment comment--without-parentheses"
			/** Stranger danger! Yes. */
			dangerouslySetInnerHTML={this.revision.parsedcomment}
		/>;

		window.deputy.comms.addEventListener(
			'revisionStatusUpdate',
			this.revisionStatusUpdateListener
		);

		// Be wary of the spaces between tags.
		return <div
			class={ ( this.revision.tags ?? [] ).map( ( v ) => 'mw-tag-' + v ).join( ' ' ) }
		>
			{unwrapWidget( this.completedCheckbox )}
			<ChangesListLinks
				revid={ this.revision.revid }
				parentid={ this.revision.parentid }
			/> {
				!this.revision.parentid && <NewPageIndicator />
			}<ChangesListTime
				timestamp={ this.revision.timestamp }
			/><ChangesListDate
				revision={ this.revision }
			/>  <ChangesListUser
				user={ this.revision.user }
			/> <span
				class="mw-changeslist-separator"
			/> <ChangesListBytes
				size={ this.revision.size }
			/> <ChangesListDiff
				size={ this.revision.size }
				diffsize={ this.revision.diffsize }
			/> <span
				class="mw-changeslist-separator"
			/> { commentElement } {
				( this.revision.tags?.length ?? -1 ) > 0 &&
				<ChangesListTags tags={this.revision.tags} />
			}
		</div> as HTMLElement;
	}

	/**
	 * Sets the disabled state of this section.
	 *
	 * @param disabled
	 */
	setDisabled( disabled: boolean ) {
		this.completedCheckbox?.setDisabled( disabled );

		this.disabled = disabled;
	}

}
