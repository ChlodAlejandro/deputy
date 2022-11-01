import { ComponentChild, h } from 'tsx-dom';
import DeputyContributionSurveySection from './DeputyContributionSurveySection';
import { DeputyUIElement } from '../DeputyUIElement';
import ContributionSurveyRow, {
	ContributionSurveyRowStatus
} from '../../models/ContributionSurveyRow';
import swapElements from '../../util/swapElements';
import unwrapWidget from '../../util/unwrapWidget';
import DeputyLoadingDots from './DeputyLoadingDots';
import DeputyContributionSurveyRevision from './DeputyContributionSurveyRevision';
import { ContributionSurveyRevision } from '../../models/ContributionSurveyRevision';
import DeputyFinishedContributionSurveyRow from './DeputyFinishedContributionSurveyRow';
import classMix from '../../util/classMix';
import { DeputyPageStatus } from '../../DeputyStorage';
import {
	DeputyMessageEvent,
	DeputyPageNextRevisionRequest,
	DeputyPageStatusRequestMessage
} from '../../DeputyCommunications';
import DeputyCCIStatusDropdown from '../shared/DeputyCCIStatusDropdown';

export enum DeputyContributionSurveyRowState {
	/*
	 * Special boolean that gets set to true if the supposed data from `this.wikitext`
	 * should not be trusted. This is usually due to UI element failures or network
	 * issues that cause the revision list to be loaded improperly (or to be not
	 * loaded at all). `this.wikitext` will return the original wikitext, if capable.
	 */
	Broken = -1,
	// Data not loaded, may be appended.
	Loading,
	// Data loaded, ready for use.
	Ready,
	// Closed by `close()`.
	Closed
}

/**
 * A UI element used for denoting the following aspects of a page in the contribution
 * survey:
 * (a) the current status of the page (violations found, no violations found, unchecked, etc.)
 * (b) the name of the page
 * (c) special page tags
 * (d) the number of edits within that specific row
 * (e) the byte size of the largest-change diff
 * (f) a list of revisions related to this page (as DeputyContributionSurveyRowRevision classes)
 * (g) closing comments
 */
export default class DeputyContributionSurveyRow extends EventTarget implements DeputyUIElement {

	static readonly menuOptionIcon: Record<ContributionSurveyRowStatus, false | string> = {
		[ ContributionSurveyRowStatus.Unfinished ]: false,
		[ ContributionSurveyRowStatus.Unknown ]: 'alert',
		[ ContributionSurveyRowStatus.WithViolations ]: 'check',
		[ ContributionSurveyRowStatus.WithoutViolations ]: 'close',
		[ ContributionSurveyRowStatus.Missing ]: 'help',
		[ ContributionSurveyRowStatus.PresumptiveRemoval ]: 'trash'
	};

	disabled: boolean;
	/**
	 * The state of this element.
	 */
	state: DeputyContributionSurveyRowState = DeputyContributionSurveyRowState.Loading;
	/**
	 * The section that this row belongs to
	 */
	section: DeputyContributionSurveySection;
	/**
	 * The "LI" element that this row was rendered into by MediaWiki.
	 */
	originalElement?: HTMLLIElement;
	/**
	 * Original wikitext of this element.
	 */
	originalWikitext: string;
	/**
	 * The contribution survey row data
	 */
	row: ContributionSurveyRow;

	/**
	 * Whether this row was originally finished upon loading.
	 */
	wasFinished: boolean;
	/**
	 * This row's main root element. Does not get swapped.
	 */
	rootElement: HTMLElement;
	/**
	 * This row's content element. Gets swapped when loaded.
	 */
	element: HTMLElement;
	/**
	 * TextInputWidget for closing comments. Used by both `renderFinished` and `renderUnfinished`.
	 */
	commentsTextInput: any;
	/**
	 * FieldLayout for `commentsTextInput`. If not set, this field is not rendered.
	 */
	commentsField: any;
	/**
	 * Button that checks all revisions of this row
	 */
	checkAllButton: any;
	/**
	 * Message box displayed when a user has set a status but not yet cleared all diffs.
	 */
	unfinishedMessageBox: any;
	/**
	 * The revisions associated with this element. Only populated by `renderUnfinished`.
	 */
	revisions: DeputyContributionSurveyRevision[];
	/**
	 * DeputyUnfinishedContributionSurveyRow, if rendered. Only rendered if this row was already
	 * finished.
	 */
	finishedRow: DeputyFinishedContributionSurveyRow;

	/**
	 * OOUI DropdownWidget for the current row status
	 */
	statusDropdown: DeputyCCIStatusDropdown;

	/**
	 * Responder for session requests.
	 */
	readonly statusRequestResponder = this.sendStatusResponse.bind( this );
	readonly nextRevisionRequestResponder = this.sendNextRevisionResponse.bind( this );

	/**
	 * A function (throttled with `mw.util.throttle`) that saves the current row's status
	 * and comments to DeputyStorage to recover unsaved data or data that could not be saved
	 * (e.g. status when some revisions remain unassessed).
	 */
	statusAutosaveFunction: () => void;

	/**
	 * @return `true` if:
	 *  (a) this row's status changed OR
	 *  (b) this row's comment changed
	 *
	 *  This does not check if the revisions themselves were modified.
	 */
	get statusModified(): boolean {
		return ( this.status !== this.row.originalStatus ||
				this.comments !== this.row.getActualComment() );
	}

	/**
	 * @return `true` if:
	 *  (a) `statusModified` is true OR
	 *  (b) diffs were marked as completed
	 *
	 *  This does not check if the revisions themselves were modified.
	 */
	get modified(): boolean {
		return this.statusModified ||
			// This is assumed as a modification, since all diffs are automatically removed
			// from the page whenever marked as complete. Therefore, there can never be a
			// situation where a row's revisions have been modified but there are no completed
			// revisions.
			this.revisions?.some( ( v ) => v.completed );
	}

	/**
	 * @return The current status of this row.
	 */
	get status(): ContributionSurveyRowStatus {
		return this.row.status;
	}
	/**
	 * Set the current status of this row.
	 *
	 * @param status The new status to apply
	 */
	set status( status: ContributionSurveyRowStatus ) {
		this.row.status = status;
	}

	/**
	 * @return `true` if this row has all diffs marked as completed.
	 */
	get completed(): boolean {
		if ( this.revisions == null ) {
			return true;
		}

		return this.revisions
			.every( ( v ) => v.completed );
	}

	/**
	 * @return `true` if this element is broken.
	 */
	get broken(): boolean {
		return this.state === DeputyContributionSurveyRowState.Broken;
	}

	/**
	 * @return The comments for this row (as added by a user)
	 */
	get comments(): string {
		return this.commentsTextInput?.getValue();
	}

	/**
	 * Generates a wikitext string representation of this row, preserving existing wikitext
	 * whenever possible.
	 *
	 * @return Wikitext
	 */
	get wikitext(): string {
		// Broken, loading, or closed. Just return the original wikitext.
		if ( this.state !== DeputyContributionSurveyRowState.Ready ) {
			return this.originalWikitext;
		}

		if ( this.wasFinished == null ) {
			console.warn(
				'Could not determine if this is an originally-finished or ' +
				'originally-unfinished row. Assuming unfinished and moving on...'
			);
		}
		const finished = this.wasFinished ?? false;

		// "* "
		let result = this.row.data.bullet;

		if ( this.row.data.creation ) {
			result += "'''N''' ";
		}

		// [[:Example]]
		result += `[[${this.row.data.page}]]`;

		// "{bullet}{creation}[[{page}]]{extras}{diffs}{comments}"
		if ( this.row.extras ) {
			result += `${this.row.extras}`;
		}

		const unfinishedDiffs = this.revisions?.filter(
			( v ) => !v.completed
		)?.sort(
			( a, b ) => ( b.revision.diffsize - a.revision.diffsize ) ||
                ( b.revision.revid - a.revision.revid )
		) ?? [];

		if ( unfinishedDiffs.length > 0 ) {
			result += unfinishedDiffs.map( ( v ) => {
				return mw.format(
					this.row.data.diffTemplate,
					v.revision.revid,
					v.revision.diffsize > 0 ? '+' + v.revision.diffsize : v.revision.diffsize,
					Math.abs( v.revision.diffsize ) > 500 ? "'''" : ''
				);
			} ).join( '' );

			if ( this.row.data.comments ) {
				// Comments existed despite not being finished yet. Allow anyway.
				result += this.row.data.comments;
			}
		} else {
			/**
			 * Function will apply the current user values to the row.
			 */
			const useUserData = () => {
				let addComments = false;
				switch ( this.status ) {
					// TODO: l10n
					case ContributionSurveyRowStatus.Unfinished:
						// This state should not exist. Just add signature (done outside of switch).
						break;
					case ContributionSurveyRowStatus.Unknown:
						// This state should not exist. Try to append comments (because if this
						// branch is running, the comment must have not been added by the positive
						// branch of this if statement). Don't append user-provided comments.
						result += this.row.comment;
						break;
					case ContributionSurveyRowStatus.WithViolations:
						result += '{{y}}';
						addComments = true;
						break;
					case ContributionSurveyRowStatus.WithoutViolations:
						result += '{{n}}';
						addComments = true;
						break;
					case ContributionSurveyRowStatus.Missing:
						result += '{{?}}';
						addComments = true;
						break;
					case ContributionSurveyRowStatus.PresumptiveRemoval:
						result += '{{x}}';
						addComments = true;
						break;
				}

				const userComments = this.comments
					.replace( /~~~~\s*$/g, '' )
					.trim();
				if ( addComments && userComments.length > 0 ) {
					result += ' ' + userComments;
				}

				// Sign.
				result += ' ~~~~';
			};

			if ( finished ) {
				if ( this.statusModified ) {
					// Modified. Use user data.
					useUserData();
				} else {
					// No changes. Just append original closure comments.
					result += this.row.comment;
				}
			} else {
				useUserData();
			}
		}

		return result;
	}

	/**
	 * Creates a new DeputyContributionSurveyRow object.
	 *
	 * @param row The contribution survey row data
	 * @param originalElement
	 * @param originalWikitext
	 * @param section The section that this row belongs to
	 */
	constructor(
		row: ContributionSurveyRow,
		originalElement: HTMLLIElement,
		originalWikitext: string,
		section: DeputyContributionSurveySection
	) {
		super();
		this.row = row;
		this.originalElement = originalElement;
		this.originalWikitext = originalWikitext;
		this.section = section;
	}

	/**
	 * Load the revision data in and change the UI element respectively.
	 */
	async loadData() {
		try {
			const diffs = await this.row.getDiffs();

			this.wasFinished = this.row.completed;

			if ( this.row.completed ) {
				this.renderRow( diffs, this.renderFinished() );
			} else {
				this.renderRow( diffs, await this.renderUnfinished( diffs ) );

				const savedStatus = await this.getSavedStatus();
				if ( !this.wasFinished && savedStatus ) {
					// An autosaved status exists. Let's use that.
					this.commentsTextInput.setValue( savedStatus.comments );
					this.statusDropdown.status = savedStatus.status;
					this.onUpdate();
				}
			}
			window.deputy.comms.addEventListener(
				'pageStatusRequest',
				this.statusRequestResponder
			);
			window.deputy.comms.addEventListener(
				'pageNextRevisionRequest',
				this.nextRevisionRequestResponder
			);
			this.state = DeputyContributionSurveyRowState.Ready;
		} catch ( e ) {
			console.error( 'Caught exception while loading data', e );
			this.state = DeputyContributionSurveyRowState.Broken;
			this.renderRow( null, unwrapWidget(
				new OO.ui.MessageWidget( {
					type: 'error',
					label: mw.msg( 'deputy.session.row.error', e.message )
				} )
			) );
			this.setDisabled( true );
		}
	}

	/**
	 * @return The hash used for autosave keys
	 */
	get autosaveHash(): string {
		return `CASE--${
			this.row.casePage.title.getPrefixedDb()
		}+PAGE--${
			this.row.title.getPrefixedDb()
		}`;
	}

	/**
	 * Perform UI updates and recheck possible values.
	 */
	onUpdate(): void {
		if ( this.statusAutosaveFunction == null ) {
			this.statusAutosaveFunction = ( mw.util as any ).throttle( async () => {
				await this.saveStatus();
			}, 500 );
		}

		if ( this.revisions && this.statusDropdown ) {
			this.statusDropdown.setOptionDisabled(
				ContributionSurveyRowStatus.Unfinished, this.completed, true
			);

			const unfinishedWithStatus = this.statusModified && !this.completed;
			if ( this.unfinishedMessageBox ) {
				this.unfinishedMessageBox.toggle( unfinishedWithStatus );
			}
			this.statusAutosaveFunction();
		}

		if ( this.wasFinished && this.statusModified && this.commentsField && this.finishedRow ) {
			this.commentsField.setNotices(
				{
					true: [ mw.msg( 'deputy.session.row.close.sigFound' ) ],
					maybe: [ mw.msg( 'deputy.session.row.close.sigFound.maybe' ) ],
					false: []
				}[ `${this.finishedRow.hasSignature()}` ]
			);
		} else if ( this.commentsField ) {
			this.commentsField.setNotices( [] );
		}

		// Emit "update" event
		this.dispatchEvent( new CustomEvent( 'update' ) );
	}

	/**
	 * Gets the database-saved status. Used for getting the autosaved values of the status and
	 * closing comments.
	 */
	async getSavedStatus(): Promise<DeputyPageStatus> {
		return await window.deputy.storage.db.get( 'pageStatus', this.autosaveHash );
	}

	/**
	 * Save the status and comment for this row to DeputyStorage.
	 */
	async saveStatus(): Promise<void> {
		if ( this.statusModified ) {
			await window.deputy.storage.db.put( 'pageStatus', {
				hash: this.autosaveHash,
				status: this.status,
				comments: this.comments
			} );
		}
	}

	/**
	 * Renders the `commentsTextInput` variable (closing comments OOUI TextInputWidget)
	 *
	 * @param value
	 * @return The OOUI TextInputWidget
	 */
	renderCommentsTextInput( value?: string ): any {
		this.commentsTextInput = new OO.ui.MultilineTextInputWidget( {
			classes: [ 'dp-cs-row-closeComments' ],
			placeholder: mw.msg( 'deputy.session.row.closeComments' ),
			value: value,
			autosize: true,
			rows: 1
		} );

		this.commentsTextInput.on( 'change', () => {
			this.onUpdate();
		} );

		return this.commentsTextInput;
	}

	/**
	 * Render the row with the "finished" state (has info
	 * on closer and closing comments).
	 *
	 * @return HTML element
	 */
	renderFinished(): ComponentChild {
		this.finishedRow = new DeputyFinishedContributionSurveyRow( {
			originalElement: this.originalElement,
			row: this.row
		} );

		return <div class="dp-cs-row-finished">
			{ this.finishedRow.render() }
			{ unwrapWidget(
				this.commentsField = new OO.ui.FieldLayout(
					this.renderCommentsTextInput( this.row.getActualComment() ),
					{
						align: 'top',
						invisibleLabel: true,
						label: mw.msg( 'deputy.session.row.closeComments' )
					}
				)
			) }
		</div>;
	}

	/**
	 * Render the row with the "unfinished" state (has
	 * revision list, etc.)
	 *
	 * @param diffs
	 * @return HTML element
	 */
	async renderUnfinished( diffs: Map<number, ContributionSurveyRevision> ): Promise<JSX.Element> {
		this.revisions = [];
		const revisionList = document.createElement( 'div' );
		revisionList.classList.add( 'dp-cs-row-revisions' );

		this.unfinishedMessageBox = new OO.ui.MessageWidget( {
			classes: [ 'dp-cs-row-unfinishedWarning' ],
			type: 'warning',
			label: mw.msg( 'deputy.session.row.unfinishedWarning' )
		} );
		this.unfinishedMessageBox.toggle( false );
		revisionList.appendChild( unwrapWidget( this.unfinishedMessageBox ) );

		revisionList.appendChild( unwrapWidget(
			this.renderCommentsTextInput()
		) );

		for ( const revision of diffs.values() ) {
			const revisionUIEl = new DeputyContributionSurveyRevision( revision, this );

			revisionUIEl.addEventListener(
				'update',
				() => {
					// Recheck options first to avoid "Unfinished" being selected when done.
					this.onUpdate();
				}
			);

			await revisionUIEl.prepare();
			revisionList.appendChild( revisionUIEl.render() );
			this.revisions.push( revisionUIEl );
		}

		return revisionList;
	}

	/**
	 * Renders action button links.
	 *
	 * @return An HTML element
	 */
	renderLinks(): JSX.Element {
		return <span class="dp-cs-row-links">
			<a
				class="dp-cs-row-link dp-cs-row-edit"
				target="_blank"
				rel="noopener" href={ mw.util.getUrl(
					this.row.title.getPrefixedDb(),
					{ action: 'edit' }
				) }
			>
				{ unwrapWidget( new OO.ui.ButtonWidget( {
					invisibleLabel: true,
					label: mw.msg( 'deputy.session.row.edit' ),
					title: mw.msg( 'deputy.session.row.edit' ),
					icon: 'edit',
					framed: false
				} ) ) }
			</a>
			<a
				class="dp-cs-row-link dp-cs-row-talk"
				target="_blank"
				rel="noopener" href={ mw.util.getUrl(
					this.row.title.getTalkPage().getPrefixedDb()
				) }
			>
				{ unwrapWidget( new OO.ui.ButtonWidget( {
					invisibleLabel: true,
					label: mw.msg( 'deputy.session.row.talk' ),
					title: mw.msg( 'deputy.session.row.talk' ),
					icon: 'speechBubbles',
					framed: false
				} ) ) }
			</a>
			<a
				class="dp-cs-row-link dp-cs-row-history"
				target="_blank"
				rel="noopener" href={ mw.util.getUrl(
					this.row.title.getPrefixedDb(),
					{ action: 'history' }
				) }
			>
				{ unwrapWidget( new OO.ui.ButtonWidget( {
					invisibleLabel: true,
					label: mw.msg( 'deputy.session.row.history' ),
					title: mw.msg( 'deputy.session.row.history' ),
					icon: 'history',
					framed: false
				} ) ) }
			</a>
		</span>;
	}

	/**
	 * Renders the details of the row. Includes details such as largest diff size, diffs
	 * remaining, etc.
	 *
	 * @param diffs
	 * @return The row details as an element (or `false`, if no details are to be shown).
	 */
	renderDetails( diffs: Map<number, ContributionSurveyRevision> ): JSX.Element | false {
		const parts: ComponentChild = [];

		if ( diffs.size > 0 ) {
			const diffArray = Array.from( diffs.values() );
			if ( diffArray.some( ( v ) => !v.parentid ) ) {
				parts.push(
					mw.message(
						'deputy.session.row.details.new',
						diffs.size.toString()
					).text()
				);
			}

			// Number of edits
			{
				parts.push(
					mw.message(
						'deputy.session.row.details.edits',
						diffs.size.toString()
					).text()
				);
			}

			// Identify largest diff
			const largestDiff = diffs.get(
				Array.from( diffs.values() )
					.sort( ( a, b ) => b.diffsize - a.diffsize )[ 0 ]
					.revid
			);

			parts.push(
				// eslint-disable-next-line mediawiki/msg-doc
				mw.message(
					`deputy.${
						largestDiff.diffsize < 0 ? 'negative' : 'positive'
					}Diff`,
					largestDiff.diffsize.toString()
				).text()
			);
		}

		const spliced: ComponentChild = [];
		for ( let index = 0; index < parts.length; index++ ) {
			spliced.push( <span class="dp-cs-row-detail">
				{ parts[ index ] }
			</span> );
			if ( index !== parts.length - 1 ) {
				spliced.push( mw.msg( 'comma-separator' ) );
			}
		}

		return parts.length === 0 ? false : <span class="dp-cs-row-details">
			({spliced})
		</span>;
	}

	/**
	 * Renders the "head" part of the row. Contains the status, page name, and details.
	 *
	 * @param diffs
	 * @param contentContainer
	 * @return The head of the row as an element
	 */
	renderHead(
		diffs: Map<number, ContributionSurveyRevision> | null,
		contentContainer: JSX.Element
	): JSX.Element {
		const possibleStatus = this.row.status;

		// Build status dropdown
		this.statusDropdown = new DeputyCCIStatusDropdown( this.row, {
			status: possibleStatus,
			requireAcknowledge: false
		} );
		if ( ( diffs && diffs.size === 0 ) || this.wasFinished ) {
			// If there are no diffs found or `this.wasFinished` is set (both meaning there are
			// no diffs and this is an already-assessed row), then the "Unfinished" option will
			// be disabled.
			this.statusDropdown.setOptionDisabled( ContributionSurveyRowStatus.Unfinished, true );
		}
		this.statusDropdown.addEventListener( 'change', ( event ) => {
			this.status = event.status;
			this.onUpdate();
		} );

		// Build mass checker
		this.checkAllButton = new OO.ui.ButtonWidget( {
			icon: 'checkAll',
			label: mw.msg( 'deputy.session.row.checkAll' ),
			title: mw.msg( 'deputy.session.row.checkAll' ),
			invisibleLabel: true,
			framed: false
		} );
		this.checkAllButton.on( 'click', () => {
			OO.ui.confirm(
				mw.msg( 'deputy.session.row.checkAll.confirm' )
			).done(
				( confirmed: boolean ) => {
					if ( confirmed ) {
						this.revisions.forEach( ( revision ) => {
							revision.completed = true;
						} );
						this.onUpdate();
					}
				}
			);
		} );

		// Build content toggler
		const contentToggle = new OO.ui.ButtonWidget( {
			classes: [ 'dp-cs-row-toggle' ],
			// Will be set by toggle function. Blank for now.
			label: '',
			invisibleLabel: true,
			framed: false
		} );

		let contentToggled = window.deputy.prefs.get( 'cci.contentDefault' );
		/**
		 * Toggles the content.
		 *
		 * @param show Whether to show the content or not.
		 */
		const toggleContent = ( show = !contentToggled ) => {
			contentToggle.setIcon( show ? 'collapse' : 'expand' );
			contentToggle.setLabel(
				mw.message(
					show ?
						'deputy.session.row.content.close' :
						'deputy.session.row.content.open'
				).text()
			);
			contentToggle.setTitle(
				mw.message(
					show ?
						'deputy.session.row.content.close' :
						'deputy.session.row.content.open'
				).text()
			);
			contentContainer.style.display = show ? 'block' : 'none';
			contentToggled = !contentToggled;
		};
		toggleContent( contentToggled );
		contentToggle.on( 'click', () => {
			toggleContent();
		} );

		return <div class="dp-cs-row-head">
			{ unwrapWidget( this.statusDropdown.dropdown ) }
			<a
				class="dp-cs-row-title"
				target="_blank"
				rel="noopener" href={ mw.format(
					mw.config.get( 'wgArticlePath' ),
					this.row.title.getPrefixedDb()
				) }
			>
				{ this.row.title.getPrefixedText() }
			</a>
			{ diffs && this.renderDetails( diffs ) }
			{ this.renderLinks() }
			{ !this.wasFinished && diffs && diffs.size > 0 && unwrapWidget( this.checkAllButton ) }
			{ !contentContainer.classList.contains( 'dp-cs-row-content-empty' ) &&
				unwrapWidget( contentToggle ) }
		</div>;
	}

	/**
	 *
	 * @param diffs
	 * @param content
	 */
	renderRow(
		diffs: Map<number, ContributionSurveyRevision>,
		content: ComponentChild
	): void {
		const contentContainer = <div
			class={classMix( [
				'dp-cs-row-content',
				!content && 'dp-cs-row-content-empty'
			] )}
		>{ content }</div>;

		this.element = swapElements(
			this.element, <div>
				{ this.renderHead( diffs, contentContainer ) }
				{ contentContainer }
			</div>
		) as HTMLElement;
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		this.element = <DeputyLoadingDots /> as HTMLElement;
		this.rootElement = <div class="dp-cs-row">
			{ this.element }
		</div> as HTMLElement;

		return this.rootElement;
	}

	/**
	 * Performs cleanup before removal.
	 */
	close(): void {
		this.state = DeputyContributionSurveyRowState.Closed;

		window.deputy.comms.removeEventListener(
			'pageStatusRequest',
			this.statusRequestResponder
		);
		window.deputy.comms.removeEventListener(
			'pageNextRevisionRequest',
			this.nextRevisionRequestResponder
		);

		this.revisions?.forEach( ( revision ) => {
			revision.close();
		} );
	}

	/**
	 * Sets the disabled state of this section.
	 *
	 * @param disabled
	 */
	setDisabled( disabled: boolean ): void {
		this.statusDropdown?.setDisabled( disabled );
		this.commentsTextInput?.setDisabled( disabled );
		this.checkAllButton?.setDisabled( disabled );
		this.revisions?.forEach( ( revision ) => revision.setDisabled( disabled ) );

		this.disabled = disabled;
	}

	/**
	 * Responds to a status request.
	 *
	 * @param event
	 */
	sendStatusResponse(
		event: DeputyMessageEvent<DeputyPageStatusRequestMessage>
	): void {
		if (
			event.data.page === this.row.title.getPrefixedText() ||
			// `this.revisions` may be undefined. If so, don't reply.
			this.revisions?.some( ( r ) => r.revision.revid === event.data.revision )
		) {
			window.deputy.comms.reply(
				event.data, {
					type: 'pageStatusResponse',
					caseId: this.row.casePage.pageId,
					caseTitle: this.row.casePage.title.getPrefixedText(),
					title: this.row.title.getPrefixedText(),
					status: this.status,
					enabledStatuses: this.statusDropdown.getEnabledOptions(),
					revisionStatus: event.data.revision ? this.revisions.find(
						( r ) => r.revision.revid === event.data.revision
					)?.completed : undefined,
					nextRevision: this.revisions?.find(
						( revision ) => !revision.completed
					)?.revision.revid ?? null
				}
			);
		}
	}

	/**
	 *
	 * @param event
	 */
	sendNextRevisionResponse(
		event: DeputyMessageEvent<DeputyPageNextRevisionRequest>
	): void {
		if (
			event.data.caseId === this.row.casePage.pageId &&
			event.data.page === this.row.title.getPrefixedText()
		) {
			if ( !this.revisions ) {
				window.deputy.comms.reply( event.data, {
					type: 'pageNextRevisionResponse',
					revid: null
				} );
			} else {
				// If `event.data.after` == null, this will be `undefined`.
				const baseRevision = this.revisions
					.find( ( r ) => r.revision.revid === event.data.after );
				const baseRevisionIndex = baseRevision == null ?
					0 : this.revisions.indexOf( baseRevision );

				const exactRevision = this.revisions.find(
					( r, i ) => i > baseRevisionIndex && !r.completed
				);
				const firstRevision = exactRevision == null ?
					this.revisions.find( ( r ) => !r.completed ) : null;

				// Returns `null` if an `exactRevision` or a `firstRevision` were not found.
				window.deputy.comms.reply( event.data, {
					type: 'pageNextRevisionResponse',
					revid: ( exactRevision ?? firstRevision )?.revision?.revid ?? null
				} );
			}
		}
	}

}
