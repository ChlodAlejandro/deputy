import { h } from 'tsx-dom';
import DeputyContributionSurveySection from './DeputyContributionSurveySection';
import { DeputyUIElement } from './DeputyUIElement';
import ContributionSurveyRow, {
	ContributionSurveyRowStatus
} from '../models/ContributionSurveyRow';
import swapElements from '../util/swapElements';
import unwrapWidget from '../util/unwrapWidget';
import DeputyLoadingDots from './DeputyLoadingDots';

/**
 * A specific revision for a section row.
 */
export class DeputyContributionSurveyRowRevision extends EventTarget {

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
export default class DeputyContributionSurveyRow implements DeputyUIElement {

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
	 * The page's status dropdown.
	 */
	statusDropdown: any;

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
		const possibleStatus = this.row.status;

		const menuOptionIcon: Record<ContributionSurveyRowStatus, false | string> = {
			[ ContributionSurveyRowStatus.Unfinished ]: false,
			[ ContributionSurveyRowStatus.Unknown ]: false,
			[ ContributionSurveyRowStatus.WithViolations ]: 'check',
			[ ContributionSurveyRowStatus.WithoutViolations ]: 'close',
			[ ContributionSurveyRowStatus.Missing ]: 'help'
		};

		const statusDropdownOptions = [];

		for ( const status in ContributionSurveyRowStatus ) {
			if (
				+status === ContributionSurveyRowStatus.Unknown &&
				possibleStatus === ContributionSurveyRowStatus.Unknown
			) {
				statusDropdownOptions.push(
					new OO.ui.MenuOptionWidget( {
						data: ContributionSurveyRowStatus.Unknown,
						label: mw.message( 'deputy.session.row.status.unknown' ).text(),
						selected: true
					} )
				);
			} else if ( !isNaN( +status ) ) {
				const statusName = ContributionSurveyRowStatus[ status ];
				const option = new OO.ui.MenuOptionWidget( {
					data: status,
					// eslint-disable-next-line mediawiki/msg-doc
					label: mw.message(
						'deputy.session.row.status.' +
						statusName[ 0 ].toLowerCase() +
						statusName.slice( 1 )
					).text(),
					icon: menuOptionIcon[ +status as ContributionSurveyRowStatus ],
					selected: possibleStatus === +status,
					disabled: +status === ContributionSurveyRowStatus.Unfinished &&
						diffs.size === 0
				} );
				statusDropdownOptions.push( option );
			}
		}

		const statusDropdown = new OO.ui.DropdownWidget( {
			classes: [ 'dp-cs-row-status' ],
			label: mw.message( 'deputy.session.row.status' ).text(),
			menu: {
				items: statusDropdownOptions
			}
		} );
		// Change the icon of the dropdown when the value changes.
		statusDropdown.getMenu().on( 'toggle', ( visible: boolean ) => {
			if ( !visible ) {
				// Dropdown has closed, option must have been selected.
				const value: ContributionSurveyRowStatus =
					statusDropdown.getMenu().findSelectedItem().getData();
				console.log( 'dropdown change', value );
				statusDropdown.setIcon( menuOptionIcon[ value ] === false ?
					null :
					menuOptionIcon[ value ]
				);
			}
		} );
		// Make the menu larger than the actual dropdown.
		statusDropdown.getMenu().on( 'ready', () => {
			statusDropdown.getMenu().toggleClipping( false );
			unwrapWidget( statusDropdown.getMenu() ).style.width = '20em';
		} );

		const largestDiff = diffs.get(
			Array.from( diffs.values() )
				.sort( ( a, b ) => b.diffsize - a.diffsize )[ 0 ]
				.revid
		);

		this.element = swapElements(
			this.element, <div>
				{ unwrapWidget( statusDropdown ) }
				<a
					class="dp-cs-row-title"
					target="_blank"
					href={'/wiki/' + this.row.title.getPrefixedDb()}
				>
					{ this.row.title.getPrefixedText() }
				</a>
				<span class="dp-cs-row-details">(test, {
					mw.message(
						'deputy.session.row.details.edits',
						diffs.size.toString()
					).text()
				}, {
					// eslint-disable-next-line mediawiki/msg-doc
					mw.message(
						`deputy.session.row.details.${
							largestDiff.diffsize < 0 ? 'negative' : 'positive'
						}Diff`,
						largestDiff.diffsize.toString()
					).text()
				})</span>
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
