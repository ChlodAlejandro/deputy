import { ComponentChild, h } from 'tsx-dom';
import DeputyContributionSurveySection from './DeputyContributionSurveySection';
import { DeputyUIElement } from './DeputyUIElement';
import ContributionSurveyRow, {
	ContributionSurveyRowStatus
} from '../models/ContributionSurveyRow';
import swapElements from '../util/swapElements';
import unwrapWidget from '../util/unwrapWidget';
import DeputyLoadingDots from './DeputyLoadingDots';
import { DeputyContributionSurveyRevision } from './DeputyContributionSurveyRevision';
import { ContributionSurveyRevision } from '../models/ContributionSurveyRevision';
import DeputyUnfinishedContributionSurveyRow from './row/DeputyUnfinishedContributionSurveyRow';

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
	 * The contribution survey row data
	 */
	row: ContributionSurveyRow;

	/**
	 * This row's main root element. Does not get swapped.
	 */
	rootElement: HTMLElement;
	/**
	 * This row's content element. Gets swapped when loaded.
	 */
	element: HTMLElement;
	/**
	 * TextInputWidget for closing comments.
	 */
	commentsTextInput: any;
	/**
	 * The revisions associated with this element.
	 */
	revisions: DeputyContributionSurveyRevision[];

	/**
	 * OOUI DropdownWidget for the current row status
	 */
	statusDropdown: any;
	/**
	 * Options for the status dropdown. Rendered by `renderHead`.
	 */
	statusDropdownOptions: Map<ContributionSurveyRowStatus, any>;

	/**
	 * Creates a new DeputyContributionSurveyRow object.
	 *
	 * @param row The contribution survey row data
	 * @param section The section that this row belongs to
	 */
	constructor( row: ContributionSurveyRow, section: DeputyContributionSurveySection ) {
		this.row = row;
		this.section = section;
	}

	/**
	 * Load the revision data in and change the UI element respectively.
	 */
	async loadData() {
		const diffs = await this.row.getDiffs();

		if ( this.row.completed ) {
			this.renderRow( diffs, this.renderFinished() );
		} else {
			this.renderRow( diffs, this.renderUnfinished( diffs ) );
		}
	}

	/**
	 *
	 */
	generateWikitext() {

	}

	/**
	 *
	 */
	recheckOptions(): void {
		if ( !this.statusDropdownOptions ) {
			// Silent failure
			return;
		}

		const uncheckedDiffs = this.revisions
			.map( ( v ) => v.done )
			.filter( ( v ) => !v )
			.length;

		if ( uncheckedDiffs === 0 ) {
			this.statusDropdownOptions.get( ContributionSurveyRowStatus.Unfinished )
				.setDisabled( true );
			this.statusDropdown.getMenu()
				.selectItemByData( ContributionSurveyRowStatus.WithoutViolations );
			this.refreshStatusDropdown();
		} else {
			this.statusDropdownOptions.get( ContributionSurveyRowStatus.Unfinished )
				.setDisabled( false );
		}

	}

	/**
	 * Render the row with the "finished" state (has info
	 * on closer and closing comments).
	 *
	 * @return HTML element
	 */
	renderFinished(): JSX.Element {
		return <DeputyUnfinishedContributionSurveyRow row={this.row} /> as HTMLElement;
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

		for ( const revision of diffs.values() ) {
			const revisionUIEl = new DeputyContributionSurveyRevision( revision );

			// TODO: Update state of dropdown (disable "unfinished")
			revisionUIEl.on(
				'update',
				( done: boolean, data: ContributionSurveyRevision ) => {
					console.log( done, data );
					this.recheckOptions();
				}
			);

			revisionList.appendChild( revisionUIEl.render() );
			this.revisions.push( revisionUIEl );
		}

		return revisionList;
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
		const value: ContributionSurveyRowStatus =
			this.statusDropdown.getMenu().findSelectedItem().getData();
		console.log( 'dropdown change', value );
		const icon = DeputyContributionSurveyRow.menuOptionIcon[ value ];
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
		diffs: Map<number, ContributionSurveyRevision>,
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
						diffs.size === 0
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
		} );
		// Make the menu larger than the actual dropdown.
		this.statusDropdown.getMenu().on( 'ready', () => {
			this.statusDropdown.getMenu().toggleClipping( false );
			unwrapWidget( this.statusDropdown.getMenu() ).style.width = '20em';
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
				show ?
					'deputy.session.row.content.close' :
					'deputy.session.row.content.open'
			);
			contentContainer.style.display = show ? 'block' : 'none';
			contentToggled = !contentToggled;
		};
		toggleContent( contentToggled );
		contentToggle.on( 'click', () => {
			toggleContent();
		} );

		// Build edit button
		const editButton = new OO.ui.ButtonWidget( {
			invisibleLabel: true,
			label: mw.message( 'deputy.session.row.history' ).text(),
			icon: 'edit',
			framed: false
		} );
		// Build talk button
		const talkButton = new OO.ui.ButtonWidget( {
			invisibleLabel: true,
			label: mw.message( 'deputy.session.row.history' ).text(),
			icon: 'speechBubbles',
			framed: false
		} );
		// Build history button
		const historyButton = new OO.ui.ButtonWidget( {
			invisibleLabel: true,
			label: mw.message( 'deputy.session.row.history' ).text(),
			icon: 'history',
			framed: false
		} );

		return <div class="dp-cs-row-head">
			{ unwrapWidget( this.statusDropdown ) }
			<a
				class="dp-cs-row-title"
				target="_blank"
				href={ mw.format(
					mw.config.get( 'wgArticlePath' ),
					this.row.title.getPrefixedDb()
				) }
			>
				{ this.row.title.getPrefixedText() }
			</a>
			{ this.renderDetails( diffs ) }
			<span class="dp-cs-row-links">
				<a
					class="dp-cs-row-link dp-cs-row-edit"
					target="_blank"
					href={ mw.format(
						mw.config.get( 'wgArticlePath' ),
						'Special:Edit/' + this.row.title.getPrefixedDb()
					) }
				>
					{ unwrapWidget( editButton ) }
				</a>
				<a
					class="dp-cs-row-link dp-cs-row-talk"
					target="_blank"
					href={ mw.format(
						mw.config.get( 'wgArticlePath' ),
						this.row.title.getTalkPage().getPrefixedDb()
					) }
				>
					{ unwrapWidget( talkButton ) }
				</a>
				<a
					class="dp-cs-row-link dp-cs-row-history"
					target="_blank"
					href={ mw.format(
						mw.config.get( 'wgArticlePath' ),
						'Special:PageHistory/' + this.row.title.getPrefixedDb()
					) }
				>
					{ unwrapWidget( historyButton ) }
				</a>
			</span>
			{ unwrapWidget( contentToggle ) }
		</div>;
	}

	/**
	 *
	 * @param diffs
	 * @param content
	 */
	renderRow( diffs: Map<number, ContributionSurveyRevision>, content: JSX.Element ): void {
		const contentContainer = <div>{ content }</div>;

		this.element = swapElements(
			this.element, <div>
				{ this.renderHead( diffs, contentContainer ) }
				{ contentContainer }
			</div> as HTMLElement
		);
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
