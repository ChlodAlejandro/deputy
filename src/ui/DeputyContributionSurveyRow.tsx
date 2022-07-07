import { ComponentChild, h } from 'tsx-dom';
import DeputyContributionSurveySection from './DeputyContributionSurveySection';
import { DeputyUIElement } from './DeputyUIElement';
import ContributionSurveyRow, {
	ContributionSurveyRowStatus
} from '../models/ContributionSurveyRow';
import swapElements from '../util/swapElements';
import unwrapWidget from '../util/unwrapWidget';
import DeputyLoadingDots from './DeputyLoadingDots';
import DeputyContributionSurveyRevision from './DeputyContributionSurveyRevision';
import { ContributionSurveyRevision } from '../models/ContributionSurveyRevision';
import DeputyFinishedContributionSurveyRow from './DeputyUnfinishedContributionSurveyRow';
import classMix from '../util/classMix';
import { DeputyDiffStatus } from '../DeputyStorage';

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
export default class DeputyContributionSurveyRow implements DeputyUIElement {

	static readonly menuOptionIcon: Record<ContributionSurveyRowStatus, false | string> = {
		[ ContributionSurveyRowStatus.Unfinished ]: false,
		[ ContributionSurveyRowStatus.Unknown ]: 'alert',
		[ ContributionSurveyRowStatus.WithViolations ]: 'check',
		[ ContributionSurveyRowStatus.WithoutViolations ]: 'close',
		[ ContributionSurveyRowStatus.Missing ]: 'help'
	};

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
	statusDropdown: any;
	/**
	 * Options for the status dropdown. Rendered by `renderHead`.
	 */
	statusDropdownOptions: Map<ContributionSurveyRowStatus, any>;

	/**
	 * Special boolean that gets set to true if the supposed data from `this.wikitext`
	 * should  not be trusted. This is usually due to UI element failures or network
	 * issues that cause the revision list to be loaded improperly (or to be not
	 * loaded at all). `this.wikitext` will return the original wikitext, if capable.
	 */
	broken: boolean;

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
		return this.statusModified || this.revisions.some( ( v ) => v.done );
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
		if ( this.broken ) {
			return this.originalWikitext;
		}

		if ( this.wasFinished == null ) {
			console.warn(
				'Could not determine if this is an originally-finished or ' +
				'originally-unfinished row. Assuming unfinished and moving on...'
			);
		}
		const finished = this.wasFinished ?? false;

		const wikitext = this.row.wikitext;
		// "* "
		let result = /\*\s*/g.exec( wikitext )[ 0 ];

		if ( /'''N'''/.test( wikitext ) ) {
			// '''N'''
			result += "'''N''' ";
		}

		// [[:Example]]
		result += `[[:${this.row.title.getPrefixedText()}]]`;

		if ( this.row.extras ) {
			result += ` ${this.row.extras}`;
		}

		result += ': ';

		const unfinishedDiffs = this.revisions?.filter(
			( v ) => !v.done
		) ?? [];

		if ( unfinishedDiffs.length > 0 ) {
			result += unfinishedDiffs.map( ( v ) => {
				return `[[Special:Diff/${v.revision.revid}|(${
					v.revision.diffsize > 0 ? '+' + v.revision.diffsize : v.revision.diffsize
				})]]`;
			} ).join( '' );
		} else {
			/**
			 * Function will apply the current user values to the row.
			 */
			const useUserData = () => {
				let addComments = false;
				switch ( this.status ) {
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
				this.renderRow( diffs, this.renderUnfinished( diffs ) );

				const savedStatus = await this.getSavedStatus();
				if ( !this.wasFinished && savedStatus ) {
					// An autosaved status exists. Let's use that.
					this.commentsTextInput.setValue( savedStatus.comments );
					this.statusDropdown.getMenu()
						.selectItemByData( savedStatus.status );
					this.refreshStatusDropdown();
				}
			}
		} catch ( e ) {
			this.broken = true;
			this.renderRow( null, new OO.ui.MessageWidget( {
				type: 'error',
				label: mw.message( 'deputy.session.row.error', e.message ).text()
			} ) );
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

		if ( this.revisions && this.statusDropdownOptions ) {
			const uncheckedDiffs = this.revisions
				.map( ( v ) => v.done )
				.filter( ( v ) => !v )
				.length;

			if ( uncheckedDiffs === 0 ) {
				this.statusDropdownOptions.get( ContributionSurveyRowStatus.Unfinished )
					.setDisabled( true );
				if ( this.status === ContributionSurveyRowStatus.Unfinished ) {
					this.statusDropdown.getMenu()
						.selectItemByData( ContributionSurveyRowStatus.WithoutViolations );
				}
				this.refreshStatusDropdown();
			} else {
				this.statusDropdownOptions.get( ContributionSurveyRowStatus.Unfinished )
					.setDisabled( false );
			}

			const unfinishedWithStatus = this.statusModified && uncheckedDiffs > 0;
			if ( this.unfinishedMessageBox ) {
				this.unfinishedMessageBox.toggle( unfinishedWithStatus );
			}
			if ( unfinishedWithStatus ) {
				this.statusAutosaveFunction();
			}
		}

		if ( this.wasFinished && this.statusModified && this.commentsField && this.finishedRow ) {
			this.commentsField.setNotices(
				{
					true: [ mw.message( 'deputy.session.row.close.sigFound' ).text() ],
					maybe: [ mw.message( 'deputy.session.row.close.sigFound.maybe' ).text() ],
					false: []
				}[ `${this.finishedRow.hasSignature()}` ]
			);
		} else if ( this.commentsField ) {
			this.commentsField.setNotices( [] );
		}

	}

	/**
	 * Gets the database-saved status. Used for getting the autosaved values of the status and
	 * closing comments.
	 */
	async getSavedStatus(): Promise<DeputyDiffStatus> {
		return await window.deputy.storage.db.get( 'diffStatus', this.autosaveHash );
	}

	/**
	 * Save the status and comment for this row to DeputyStorage.
	 */
	async saveStatus(): Promise<void> {
		if ( this.statusModified ) {
			await window.deputy.storage.db.put( 'diffStatus', {
				hash: this.autosaveHash,
				casePageID: this.row.casePage.pageId,
				page: this.row.title.getPrefixedText(),
				status: this.status,
				comments: this.comments
			} );
		}
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

		this.commentsTextInput = new OO.ui.TextInputWidget( {
			classes: [ 'dp-cs-row-closeComments' ],
			placeholder: mw.message( 'deputy.session.row.closeComments' ).text(),
			value: this.row.getActualComment()
		} );

		this.commentsTextInput.on( 'change', () => {
			this.onUpdate();
		} );

		return <div class="dp-cs-row-finished">
			{ this.finishedRow.render() }
			{ unwrapWidget( this.commentsField = new OO.ui.FieldLayout( this.commentsTextInput, {
				align: 'top',
				invisibleLabel: true,
				label: mw.message( 'deputy.session.row.closeComments' ).text()
			} ) ) }
		</div>;
	}

	/**
	 * Render the row with the "unfinished" state (has
	 * revision list, etc.)
	 *
	 * @param diffs
	 * @return HTML element
	 */
	renderUnfinished( diffs: Map<number, ContributionSurveyRevision> ): JSX.Element {
		this.revisions = [];
		const revisionList = document.createElement( 'div' );
		revisionList.classList.add( 'dp-cs-row-revisions' );

		this.unfinishedMessageBox = new OO.ui.MessageWidget( {
			classes: [ 'dp-cs-row-unfinishedWarning' ],
			type: 'warn',
			label: mw.message( 'deputy.session.row.unfinishedWarning' ).text()
		} );
		this.unfinishedMessageBox.toggle( false );
		revisionList.appendChild( unwrapWidget( this.unfinishedMessageBox ) );

		this.commentsTextInput = new OO.ui.TextInputWidget( {
			classes: [ 'dp-cs-row-closeComments' ],
			placeholder: mw.message( 'deputy.session.row.closeComments' ).text()
		} );
		revisionList.appendChild( unwrapWidget( this.commentsTextInput ) );

		this.commentsTextInput.on( 'change', () => {
			this.onUpdate();
		} );

		for ( const revision of diffs.values() ) {
			const revisionUIEl = new DeputyContributionSurveyRevision( revision );

			// TODO: Update state of dropdown (disable "unfinished")
			revisionUIEl.on(
				'update',
				( done: boolean, data: ContributionSurveyRevision ) => {
					console.log( done, data );
					// Recheck options first to avoid "Unfinished" being selected when done.
					this.onUpdate();
					console.log( this.wikitext );
				}
			);

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
					label: mw.message( 'deputy.session.row.edit' ).text(),
					title: mw.message( 'deputy.session.row.edit' ).text(),
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
					label: mw.message( 'deputy.session.row.talk' ).text(),
					title: mw.message( 'deputy.session.row.talk' ).text(),
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
					label: mw.message( 'deputy.session.row.history' ).text(),
					title: mw.message( 'deputy.session.row.history' ).text(),
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
				spliced.push( mw.message( 'comma-separator' ).text() );
			}
		}

		return parts.length === 0 ? false : <span class="dp-cs-row-details">
			({spliced})
		</span>;
	}

	/**
	 * Refreshes the status dropdown's icon.
	 */
	refreshStatusDropdown() {
		if ( !this.statusDropdown ) {
			// Silent failure
			return;
		}

		// Dropdown has closed, option must have been selected.
		this.status = this.statusDropdown.getMenu().findSelectedItem().getData();
		const icon = DeputyContributionSurveyRow.menuOptionIcon[ this.status ];
		this.statusDropdown.setIcon( icon === false ? null : icon );
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
		this.statusDropdownOptions = new Map();

		// Build status dropdown

		for ( const status in ContributionSurveyRowStatus ) {
			if ( +status === ContributionSurveyRowStatus.Unknown ) {
				if ( possibleStatus === ContributionSurveyRowStatus.Unknown ) {
					this.statusDropdownOptions.set(
						possibleStatus,
						new OO.ui.MenuOptionWidget( {
							data: ContributionSurveyRowStatus.Unknown,
							label: mw.message( 'deputy.session.row.status.unknown' ).text(),
							icon: DeputyContributionSurveyRow.menuOptionIcon[
								+status as ContributionSurveyRowStatus
							],
							selected: true,
							disabled: true
						} )
					);
				}
			} else if ( !isNaN( +status ) ) {
				const statusName = ContributionSurveyRowStatus[ status ];
				const option = new OO.ui.MenuOptionWidget( {
					data: +status,
					// eslint-disable-next-line mediawiki/msg-doc
					label: mw.message(
						'deputy.session.row.status.' +
						statusName[ 0 ].toLowerCase() +
						statusName.slice( 1 )
					).text(),
					icon: DeputyContributionSurveyRow.menuOptionIcon[
						+status as ContributionSurveyRowStatus
					],
					selected: possibleStatus === +status,
					disabled: +status === ContributionSurveyRowStatus.Unfinished &&
						diffs && diffs.size === 0
				} );
				this.statusDropdownOptions.set( +status, option );
			}
		}

		this.statusDropdown = new OO.ui.DropdownWidget( {
			classes: [ 'dp-cs-row-status' ],
			label: mw.message( 'deputy.session.row.status' ).text(),
			menu: {
				items: Array.from( this.statusDropdownOptions.values() )
			}
		} );
		this.refreshStatusDropdown();

		// Change the icon of the dropdown when the value changes.
		this.statusDropdown.getMenu().on( 'toggle', ( visible: boolean ) => {
			if ( !visible ) {
				this.refreshStatusDropdown();
			}
			this.onUpdate();
		} );
		// Make the menu larger than the actual dropdown.
		this.statusDropdown.getMenu().on( 'ready', () => {
			this.statusDropdown.getMenu().toggleClipping( false );
			unwrapWidget( this.statusDropdown.getMenu() ).style.width = '20em';
		} );

		// Build mass checker
		const checkAll = new OO.ui.ButtonWidget( {
			icon: 'checkAll',
			label: mw.message( 'deputy.session.row.checkAll' ).text(),
			title: mw.message( 'deputy.session.row.checkAll' ).text(),
			invisibleLabel: true,
			framed: false
		} );
		checkAll.on( 'click', () => {
			OO.ui.confirm(
				mw.message( 'deputy.session.row.checkAll.confirm' ).text()
			).done(
				( confirmed: boolean ) => {
					if ( confirmed ) {
						this.revisions.forEach( ( revision ) => {
							revision.done = true;
						} );
						this.onUpdate();
					}
				}
			);
		} );

		// Build revision list toggler
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
			{ unwrapWidget( this.statusDropdown ) }
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
			{ !this.wasFinished && diffs && diffs.size > 0 && unwrapWidget( checkAll ) }
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

		this.loadData();

		return this.rootElement;
	}

}
