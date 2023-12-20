import { DeputyUIElement } from '../DeputyUIElement';
import { ContributionSurveyRevision } from '../../models/ContributionSurveyRevision';
import { h } from 'tsx-dom';
import unwrapWidget from '../../util/unwrapWidget';
import { DeputyMessageEvent, DeputyRevisionStatusUpdateMessage } from '../../DeputyCommunications';
import type DeputyContributionSurveyRow from './DeputyContributionSurveyRow';
import {
	ChangesListLinks, ChangesListMissingRow, ChangesListRow
} from '../shared/ChangesList';
import DeputyLoadingDots from './DeputyLoadingDots';
import MwApi from '../../MwApi';
import classMix from '../../util/classMix';
import DeputyMessageWidget from '../shared/DeputyMessageWidget';
import swapElements from '../../util/swapElements';
import getApiErrorText from '../../wiki/util/getApiErrorText';
import removeElement from '../../util/removeElement';

export interface DeputyContributionSurveyRevisionOptions {
	expanded?: boolean;
}

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
	 * Whether this revision is expanded by default.
	 */
	private readonly autoExpanded: boolean;

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
	 * The <div> of this element.
	 * @private
	 */
	private element: HTMLElement;
	/**
	 * The checkbox to indicate that a diff has been checked by the user.
	 *
	 * @private
	 */
	private completedCheckbox: OO.ui.CheckboxInputWidget;
	/**
	 * The toggle button to show and hide a diff view of the given revision.
	 * @private
	 */
	private diffToggle: OO.ui.ToggleButtonWidget;
	/**
	 * The diff view of the given revision. May also be "loading" text, or
	 * null if the diff view has not yet been set.
	 * @private
	 */
	private diff: HTMLElement | null = null;

	/**
	 * @param revision
	 * @param row
	 * @param options
	 * @param options.expanded
	 */
	constructor(
		revision: ContributionSurveyRevision,
		row: DeputyContributionSurveyRow,
		options: DeputyContributionSurveyRevisionOptions = {}
	) {
		super();
		this.revision = revision;
		this.uiRow = row;
		this.autoExpanded = options.expanded ?? false;

		if ( this.statusAutosaveFunction == null ) {
			// TODO: types-mediawiki limitation
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
			title: mw.msg( 'deputy.session.revision.assessed' ),
			selected: await this.getSavedStatus(),
			classes: [ 'dp-cs-rev-checkbox' ]
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
					( revision ) => !revision.completed &&
						revision.revision.revid !== this.revision.revid
				)?.revision.revid ?? null
			} );
			this.statusAutosaveFunction();
		} );

		this.diffToggle = new OO.ui.ToggleButtonWidget( {
			label: mw.msg( 'deputy.session.revision.diff.toggle' ),
			invisibleLabel: true,
			indicator: 'down',
			framed: false,
			classes: [ 'dp-cs-rev-toggleDiff' ],
			value: this.autoExpanded
		} );

		this.diff = <div class="dp-cs-rev-diff"/> as HTMLElement;

		let loaded = false;
		const handleDiffToggle = ( active: boolean ) => {
			this.diffToggle.setIndicator( active ? 'up' : 'down' );
			if ( active && this.diff.classList.contains( 'dp-cs-rev-diff--errored' ) ) {
				// Remake diff panel
				this.diff = swapElements( this.diff, <div class="dp-cs-rev-diff"/> as HTMLElement );
			} else if ( loaded ) {
				this.diff.classList.toggle( 'dp-cs-rev-diff--hidden', !active );
			}

			if ( active && !loaded ) {
				// Going active, clear the element out
				Array.from( this.diff.children ).forEach(
					( child ) => this.diff.removeChild( child )
				);
				this.diff.setAttribute( 'class', 'dp-cs-rev-diff' );
				this.diff.appendChild( <DeputyLoadingDots/> );

				const comparePromise = MwApi.action.get( {
					action: 'compare',
					fromrev: this.revision.revid,
					torelative: 'prev',
					prop: 'diff'
				} );
				const stylePromise = mw.loader.using( 'mediawiki.diff.styles' );

				// Promise.all not used here since we need to use JQuery.Promise#then
				// if we want to access the underlying error response.
				$.when( [ comparePromise, stylePromise ] )
					.then( ( results ) => results[ 0 ] )
					.then( ( data ) => {
						unwrapWidget( this.diffToggle ).classList.add(
							'dp-cs-rev-toggleDiff--loaded'
						);
						// Clear element out again
						Array.from( this.diff.children ).forEach(
							( child ) => this.diff.removeChild( child )
						);

						// https://youtrack.jetbrains.com/issue/WEB-61047
						// noinspection JSXDomNesting
						const diffTable = <table class={ classMix(
							'diff',
							`diff-editfont-${ mw.user.options.get( 'editfont' ) }`
						) }>
							<colgroup>
								<col class="diff-marker" />
								<col class="diff-content" />
								<col class="diff-marker" />
								<col class="diff-content" />
							</colgroup>
						</table>;
						// Trusted .innerHTML (data always comes from MediaWiki Action API)
						diffTable.innerHTML += data.compare.body;

						diffTable.querySelectorAll( 'tr' ).forEach( ( tr ) => {
						// Delete all header rows
							if ( tr.querySelector( '.diff-lineno' ) ) {
								removeElement( tr );
								return;
							}
							// Delete all no-change rows (gray rows)
							// !(.diff-markers with a marker) = no change for row
							if ( !tr.querySelector( 'td.diff-marker[data-marker]' ) ) {
								removeElement( tr );
							}
						} );

						this.diff.classList.toggle( 'dp-cs-rev-diff--loaded', true );
						this.diff.classList.toggle( 'dp-cs-rev-diff--errored', false );
						this.diff.appendChild( diffTable );
						loaded = true;
					}, ( _error, errorData ) => {
						// Clear element out again
						Array.from( this.diff.children ).map(
							( child ) => this.diff.removeChild( child )
						);

						this.diff.classList.toggle( 'dp-cs-rev-diff--loaded', true );
						this.diff.classList.toggle( 'dp-cs-rev-diff--errored', true );
						this.diff.appendChild( unwrapWidget( DeputyMessageWidget( {
							type: 'error',
							message: mw.msg(
								'deputy.session.revision.diff.error',
								errorData ?
									getApiErrorText( errorData ) :
									( _error as Error ).message
							)
						} ) ) );
					} );
			}
		};

		this.diffToggle.on( 'change', ( checked: boolean ) => {
			handleDiffToggle( checked );
		} );

		if ( this.autoExpanded ) {
			handleDiffToggle( true );
		}
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		window.deputy.comms.addEventListener(
			'revisionStatusUpdate',
			this.revisionStatusUpdateListener
		);

		// Be wary of the spaces between tags.
		return this.element = <div
			class={ ( this.revision.tags ?? [] ).map(
				( v ) => 'mw-tag-' + v
					.replace( /[^A-Z0-9-]/gi, '' )
					.replace( /\s/g, '_' )
			).join( ' ' ) }
		>
			{unwrapWidget( this.completedCheckbox )}
			{unwrapWidget( this.diffToggle )}
			<ChangesListLinks
				revid={ this.revision.revid }
				parentid={ this.revision.parentid }
				missing={ ( this.revision as any ).missing }
			/>{
				( this.revision as any ).missing ?
					<ChangesListMissingRow revision={this.revision}/> :
					<ChangesListRow revision={this.revision}/>
			}{this.diff}
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
