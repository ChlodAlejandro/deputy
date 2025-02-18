import { ComponentChild, h } from 'tsx-dom';
import DeputyContributionSurveySection from './DeputyContributionSurveySection';
import { DeputyUIElement } from '../DeputyUIElement';
import ContributionSurveyRow from '../../models/ContributionSurveyRow';
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
import { ContributionSurveyRowSort } from '../../models/ContributionSurveyRowSort';
import last from '../../util/last';
import warn from '../../util/warn';
import error from '../../util/error';
import { ContributionSurveyRowStatus } from '../../models/ContributionSurveyRowStatus';
import dangerModeConfirm from '../../util/dangerModeConfirm';

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
	 * Additional comments that may have been left by other editors.
	 */
	additionalComments: Element[];
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
	 * Sort order of this row. Automatically guessed when loaded.
	 */
	sortOrder: ContributionSurveyRowSort;
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
	commentsTextInput: OO.ui.TextInputWidget;
	/**
	 * FieldLayout for `commentsTextInput`. If not set, this field is not rendered.
	 */
	commentsField: OO.ui.FieldLayout;
	/**
	 * Button that checks all revisions of this row
	 */
	checkAllButton: OO.ui.ButtonWidget;
	/**
	 * Message box displayed when a user has set a status but not yet cleared all diffs.
	 */
	unfinishedMessageBox: OO.ui.MessageWidget;
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
			warn(
				'Could not determine if this is an originally-finished or ' +
				'originally-unfinished row. Assuming unfinished and moving on...'
			);
		}

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
			( a, b ) => ContributionSurveyRow.getSorterFunction( this.sortOrder )(
				a.revision,
				b.revision
			)
		) ?? [];

		let diffsText = '';
		if ( unfinishedDiffs.length > 0 ) {
			diffsText += unfinishedDiffs.map( ( v ) => {
				return mw.format(
					this.row.data.diffTemplate,
					String( v.revision.revid ),
					v.revision.diffsize == null ?
						// For whatever reason, diffsize is missing. Fall back to the text we had
						// previously.
						v.uiRow.row.data.revidText[ v.revision.revid ] :
						String( v.revision.diffsize > 0 ?
							'+' + v.revision.diffsize : v.revision.diffsize )
				);
			} ).join( '' );

			result += mw.format( this.row.data.diffsTemplate, diffsText );

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

			if ( this.statusModified ) {
				// Modified. Use user data.
				useUserData();
			} else if ( this.wasFinished ?? false ) {
				// No changes. Just append original closure comments.
				result += this.row.comment;
			}
			// Otherwise, leave this row unchanged.
		}

		return result;
	}

	/**
	 * @return The hash used for autosave keys
	 */
	get autosaveHash(): string {
		return `CASE--${
			this.row.casePage.title.getPrefixedDb()
		}+H--${
			this.section.headingName
		}-${
			this.section.headingN
		}+PAGE--${
			this.row.title.getPrefixedDb()
		}`;
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
		this.additionalComments = this.extractAdditionalComments();
		this.originalWikitext = originalWikitext;
		this.section = section;
	}

	/**
	 * Extracts HTML elements which may be additional comments left by others.
	 * The general qualification for this is that it has to be a list block
	 * element that comes after the main line (in this case, it's detected after
	 * the last .
	 * This appears in the following form in wikitext:
	 *
	 * ```
	 * * [[Page]] (...) [[Special:Diff/...|...]]
	 * *: Hello!                                                 <-- definition list block
	 * ** What!?                                                 <-- sub ul
	 * *# Yes.                                                   <-- sub ol
	 * * [[Page]] (...) [[Special:Diff/...|...]]<div>...</div>   <-- inline div
	 * ```
	 *
	 * Everything else (`*<div>...`, `*'''...`, `*<span>`, etc.) is considered
	 * not to be an additional comment.
	 *
	 * If no elements were found, this returns an empty array.
	 *
	 * @return An array of HTMLElements
	 */
	extractAdditionalComments(): Element[] {
		// COMPAT: Specific to MER-C contribution surveyor
		// Initialize to first successive diff link.
		let lastSuccessiveDiffLink = this.originalElement.querySelector(
			'a[href^="/wiki/Special:Diff/"]'
		);

		const elements: Element[] = [];
		if ( !lastSuccessiveDiffLink ) {
			// No diff links. Get last element, check if block element, and crawl backwards.
			let nextDiscussionElement = this.originalElement.lastElementChild;
			while (
				nextDiscussionElement &&
				window.getComputedStyle( nextDiscussionElement, '' ).display === 'block'
			) {
				elements.push( nextDiscussionElement );

				nextDiscussionElement = nextDiscussionElement.previousElementSibling;
			}
		} else {
			while (
				lastSuccessiveDiffLink.nextElementSibling &&
				lastSuccessiveDiffLink.nextElementSibling.tagName === 'A' &&
				lastSuccessiveDiffLink
					.nextElementSibling
					.getAttribute( 'href' )
					.startsWith( '/wiki/Special:Diff' )
			) {
				lastSuccessiveDiffLink = lastSuccessiveDiffLink.nextElementSibling;
			}
			// The first block element after `lastSuccessiveDiffLink` is likely discussion,
			// and everything after it is likely part of such discussion.
			let pushing = false;
			let nextDiscussionElement = lastSuccessiveDiffLink.nextElementSibling;
			while ( nextDiscussionElement != null ) {
				if (
					!pushing &&
					window.getComputedStyle( nextDiscussionElement ).display === 'block'
				) {
					pushing = true;
					elements.push( nextDiscussionElement );
				} else if ( pushing ) {
					elements.push( nextDiscussionElement );
				}

				nextDiscussionElement = nextDiscussionElement.nextElementSibling;
			}
		}

		return elements;
	}

	/**
	 * Load the revision data in and change the UI element respectively.
	 */
	async loadData() {
		try {
			const diffs = await this.row.getDiffs();
			this.sortOrder = ContributionSurveyRow.guessSortOrder( diffs.values() );

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
			error( 'Caught exception while loading data', e );
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
	 * Perform UI updates and recheck possible values.
	 */
	onUpdate(): void {
		if ( this.statusAutosaveFunction == null ) {
			// TODO: types-mediawiki limitation
			this.statusAutosaveFunction = ( mw.util as any ).throttle( async () => {
				await this.saveStatus();
			}, 500 );
		}

		if ( this.revisions && this.statusDropdown ) {
			if ( this.row.type !== 'pageonly' ) {
				// Only disable this option if the row isn't already finished.
				this.statusDropdown.setOptionDisabled(
					ContributionSurveyRowStatus.Unfinished, this.completed, true
				);
			}

			const unfinishedWithStatus = this.statusModified && !this.completed;
			if ( this.unfinishedMessageBox ) {
				this.unfinishedMessageBox.toggle(
					// If using danger mode, this should always be enabled.
					!window.deputy.config.core.dangerMode.get() &&
					unfinishedWithStatus
				);
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
		return await window.deputy.storage.db.get( 'pageStatus', this.autosaveHash ) ??
			// Old hash (< v0.9.0)
			await window.deputy.storage.db.get( 'pageStatus', `CASE--${
				this.row.casePage.title.getPrefixedDb()
			}+PAGE--${
				this.row.title.getPrefixedDb()
			}` );
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
	 * Mark all revisions of this section as finished.
	 */
	markAllAsFinished(): void {
		if ( !this.revisions ) {
			// If `renderUnfinished` was never called, this will be undefined.
			// We want to skip over instead.
			return;
		}
		this.revisions.forEach( ( revision ) => {
			revision.completed = true;
		} );
		this.onUpdate();
	}

	/**
	 * Renders the `commentsTextInput` variable (closing comments OOUI TextInputWidget)
	 *
	 * @param value
	 * @return The OOUI TextInputWidget
	 */
	renderCommentsTextInput( value?: string ): OO.ui.TextInputWidget {
		this.commentsTextInput = new OO.ui.MultilineTextInputWidget( {
			classes: [ 'dp-cs-row-closeComments' ],
			placeholder: mw.msg( 'deputy.session.row.closeComments' ),
			value: value ?? '',
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
			this.renderCommentsTextInput( this.row.comment )
		) );

		if ( this.row.type === 'pageonly' ) {
			revisionList.appendChild( <div class="dp-cs-row-pageonly">
				<i>{ mw.msg( 'deputy.session.row.pageonly' ) }</i>
			</div> );
		} else {
			const cciConfig = window.deputy.config.cci;
			const maxSize = cciConfig.maxSizeToAutoShowDiff.get();
			for ( const revision of diffs.values() ) {
				const revisionUIEl = new DeputyContributionSurveyRevision(
					revision, this, {
						expanded: cciConfig.autoShowDiff.get() &&
							diffs.size < cciConfig.maxRevisionsToAutoShowDiff.get() &&
							( maxSize === -1 || Math.abs( revision.diffsize ) < maxSize )
					}
				);

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

		// Timestamp is always found in a non-missing diff, suppressed or not.
		const validDiffs = Array.from( diffs.values() ).filter( ( v ) => v.timestamp );
		if ( validDiffs.length > 0 ) {
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
			parts.push(
				mw.message(
					'deputy.session.row.details.edits',
					diffs.size.toString()
				).text()
			);

			// Identify largest diff
			const largestDiff = diffs.get(
				Array.from( diffs.values() )
					.sort( ContributionSurveyRow.getSorterFunction(
						ContributionSurveyRowSort.Bytes
					) )[ 0 ]
					.revid
			);

			parts.push(
				// Messages that can be used here:
				// * deputy.negativeDiff
				// * deputy.positiveDiff
				// * deputy.zeroDiff
				mw.message(
					`deputy.${
						{
							'-1': 'negative',
							1: 'positive',
							0: 'zero'
						}[ Math.sign( largestDiff.diffsize ) ]
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
		if (
			this.row.type !== 'pageonly' &&
			( ( diffs && diffs.size === 0 ) || this.wasFinished )
		) {
			// If there are no diffs found or `this.wasFinished` is set (both meaning there are
			// no diffs and this is an already-assessed row), then the "Unfinished" option will
			// be disabled. This does not apply for page-only rows, which never have diffs.
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
			dangerModeConfirm(
				window.deputy.config,
				mw.msg( 'deputy.session.row.checkAll.confirm' )
			).done(
				( confirmed: boolean ) => {
					if ( confirmed ) {
						this.markAllAsFinished();
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

		let contentToggled = !window.deputy.config.cci.autoCollapseRows.get();
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
			contentToggled = show;
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
	 * Renders additional comments that became part of this row.
	 *
	 * @return An HTML element.
	 */
	renderAdditionalComments(): JSX.Element {
		const additionalComments = <div class="dp-cs-row-comments">
			<b>{ mw.msg( 'deputy.session.row.additionalComments' ) }</b>
			<hr/>
			<div class="dp-cs-row-comments-content" dangerouslySetInnerHTML={
				this.additionalComments.map( e => e.innerHTML ).join( '' )
			} />
		</div>;

		// Open all links in new tabs.
		additionalComments.querySelectorAll( '.dp-cs-row-comments-content a' )
			.forEach( a => a.setAttribute( 'target', '_blank' ) );

		return additionalComments;
	}

	/**
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
				{ this.additionalComments?.length > 0 && this.renderAdditionalComments() }
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
		const rev = this.revisions?.find(
			( r ) => r.revision.revid === event.data.revision
		);
		// Handles the cases:
		// * Page title and revision ID (if supplied) match
		// * Page title matches
		// * Page revision ID (if supplied) matches
		if (
			event.data.page === this.row.title.getPrefixedText() ||
			( rev && event.data.revision )
		) {
			window.deputy.comms.reply(
				event.data, {
					type: 'pageStatusResponse',
					caseId: this.row.casePage.pageId,
					caseTitle: this.row.casePage.title.getPrefixedText(),
					title: this.row.title.getPrefixedText(),
					status: this.status,
					enabledStatuses: this.statusDropdown.getEnabledOptions(),
					rowType: this.row.type,
					revisionStatus: rev ? rev.completed : undefined,
					revision: event.data.revision,
					nextRevision: this.revisions?.find(
						( revision ) => !revision.completed &&
							revision.revision.revid !== event.data.revision
					)?.revision.revid ?? null
				}
			);
		}
	}

	/**
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

				// Find the next revision that is not completed.
				const exactRevision = event.data.reverse ?
					last( this.revisions.filter(
						( r, i ) => i < baseRevisionIndex && !r.completed
					) ) :
					this.revisions.find(
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
