import '../../types';
import ContributionSurveyRow, {
	ContributionSurveyRowStatus
} from '../../models/ContributionSurveyRow';
import unwrapWidget from '../../util/unwrapWidget';
import DeputyCasePage from '../../wiki/DeputyCasePage';

export interface DeputyCCIStatusDropdownProps {
	/**
	 * The initial status of the page.
	 */
	status?: ContributionSurveyRowStatus
	/**
	 * The list of enabled status options. If not available, the option will
	 * be dimmed, <b>with the exception of `Unknown`</b>, which will be
	 * hidden.
	 */
	enabled?: ContributionSurveyRowStatus[];
}

/**
 *
 */
export default class DeputyCCIStatusDropdown extends EventTarget {

	static readonly menuOptionIcons = {
		[ ContributionSurveyRowStatus.Unfinished ]: false,
		[ ContributionSurveyRowStatus.Unknown ]: 'alert',
		[ ContributionSurveyRowStatus.WithViolations ]: 'check',
		[ ContributionSurveyRowStatus.WithoutViolations ]: 'close',
		[ ContributionSurveyRowStatus.Missing ]: 'help'
	};

	/**
	 * The origin row of this dropdown. Contains info on the active case page and the
	 * title that this dropdown is for.
	 */
	row: ContributionSurveyRow;
	/**
	 * The OOUI DropdownWidget element. This does <b>not</b> use DropdownInputWidget
	 * due to its lack of support for icons in dropdown menu options and the ability
	 * to hide said icons using CSS and other fun trickery.
	 */
	statusDropdown: any;
	/**
	 * A set of OOUI MenuOptionWidgets that make up the status dropdown.
	 */
	statusDropdownOptions: Map<ContributionSurveyRowStatus, any>;
	/**
	 * A listener that listens to changes in the status dropdown and performs respective
	 * updates and changes.
	 */
	statusDropdownChangeListener: ( items: any[] ) => void;

	/**
	 * @return The currently-selected status of this dropdown.
	 */
	get status(): ContributionSurveyRowStatus {
		return this.statusDropdown.getMenu().findSelectedItem().getData();
	}

	/**
	 * Create a new DeputyCCIStatusDropdown object.
	 *
	 * @param row The origin row of this dropdown.
	 *     For the root session, this is simply the `row` field of the
	 *      DeputyContributionSurveyRow that is handling the row.
	 *     For dependent sessions, this is a much simpler version which includes
	 *      only the case page info and the row title.
	 * @param row.casePage The DeputyCasePage for this dropdown
	 * @param row.title The title of the row (page) that this dropdown accesses
	 * @param options Additional construction options, usually used by the root session.
	 */
	constructor( row: {
		casePage: DeputyCasePage,
		title: mw.Title
	}, options: DeputyCCIStatusDropdownProps = {} ) {
		super();
		this.statusDropdownOptions = new Map();

		for ( const status in ContributionSurveyRowStatus ) {
			if ( isNaN( +status ) ) {
				// String key, skip.
				continue;
			}

			const statusName = ContributionSurveyRowStatus[ status ];
			const option = new OO.ui.MenuOptionWidget( {
				data: +status,
				// eslint-disable-next-line mediawiki/msg-doc
				label: mw.message(
					'deputy.session.row.status.' +
					statusName[ 0 ].toLowerCase() +
					statusName.slice( 1 )
				).text(),
				icon: DeputyCCIStatusDropdown.menuOptionIcons[
					+status as ContributionSurveyRowStatus
				],
				// Always disable if Unknown, as Unknown is merely a placeholder value.
				disabled: +status === ContributionSurveyRowStatus.Unknown
			} );
			this.statusDropdownOptions.set( +status, option );
		}

		if ( options.status ) {
			this.setValue( options.status );
		}
		if ( options.enabled ) {
			this.setEnabledOptions( options.enabled );
		}

		this.statusDropdown = new OO.ui.DropdownWidget( {
			classes: [ 'dp-cs-row-status' ],
			label: mw.message( 'deputy.session.row.status' ).text(),
			menu: {
				items: Array.from( this.statusDropdownOptions.values() )
			}
		} );

		this.statusDropdownChangeListener = () => {
			this.dispatchEvent( Object.assign( new Event( 'change' ), {
				status: this.status
			} ) );
			this.refresh();
			window.deputy.comms.send( {
				type: 'pageStatusUpdate',
				caseId: this.row.casePage.pageId,
				page: this.row.title.getPrefixedText(),
				status: this.status
			} );
		};

		// Change the icon of the dropdown when the value changes.
		this.statusDropdown.getMenu().on( 'change', this.statusDropdownChangeListener );
		// Make the menu larger than the actual dropdown.
		this.statusDropdown.getMenu().on( 'ready', () => {
			this.statusDropdown.getMenu().toggleClipping( false );
			unwrapWidget( this.statusDropdown.getMenu() ).style.width = '20em';
		} );
	}

	/**
	 * @inheritDoc
	 */
	addEventListener(
		type: 'change',
		callback: (
			evt: Event & { type: 'change', status: ContributionSurveyRowStatus }
		) => void | null,
		options?: AddEventListenerOptions | boolean
	) {
		super.addEventListener( type, callback, options );
	}

	/**
	 * Refreshes the status dropdown for any changes.
	 */
	refresh(): void {
		const icon = DeputyCCIStatusDropdown.menuOptionIcons[ this.status ];
		this.statusDropdown.setIcon( icon === false ? null : icon );
	}

	/**
	 *
	 * @param enabledOptions
	 * @param broadcast
	 */
	setEnabledOptions( enabledOptions: ContributionSurveyRowStatus[], broadcast = false ) {
		for ( const status in ContributionSurveyRowStatus ) {
			const option = this.statusDropdownOptions.get( +status );
			const toEnable = enabledOptions.indexOf( +status ) !== -1;
			const optionDisabled = option.isDisabled();

			if ( toEnable && optionDisabled ) {
				this.setOptionDisabled( +status, false, broadcast );
			} else if ( !toEnable && !optionDisabled ) {
				this.setOptionDisabled( +status, true, broadcast );
			}
		}
	}

	/**
	 * Sets the disabled state of the dropdown. Does not affect menu options.
	 *
	 * @param disabled
	 */
	setDisabled( disabled: boolean ) {
		this.statusDropdown.setDisabled( disabled );
	}

	/**
	 * Sets the 'disable state' of specific menu options. For the `Unknown` option, a
	 * specific case is made which removes the option from the menu entirely.
	 *
	 * @param status
	 * @param disabled
	 * @param broadcast
	 */
	setOptionDisabled( status: ContributionSurveyRowStatus, disabled: boolean, broadcast = false ) {
		if ( status === ContributionSurveyRowStatus.Unknown ) {
			// Special treatment. This hides the entire option from display.
			this.statusDropdownOptions.get( status ).toggle( disabled );
		} else {
			// Disable the disable flag.
			this.statusDropdownOptions.get( status ).setDisabled( disabled );
		}
		if ( disabled ) {
			this.selectNextBestValue( status );
		}
		if ( broadcast ) {
			window.deputy.comms.send( {
				type: 'pageStatusUpdate',
				caseId: this.row.casePage.pageId,
				page: this.row.title.getPrefixedText(),
				status: this.status,
				[ disabled ? 'disabledOptions' : 'enabledOptions' ]: [ status ]
			} );
		}
	}

	/**
	 * Sets the value of the dropdown.
	 *
	 * @param status
	 */
	setValue( status: ContributionSurveyRowStatus ): void {
		if ( status === ContributionSurveyRowStatus.Unknown ) {
			this.setOptionDisabled( status, false, true );
		}
		this.statusDropdown.getMenu().selectItemByData( status );
	}

	/**
	 * When an option is about to be closed and the current status matches that option,
	 * this function will find the next best option and select it. The next best value
	 * is as follows:
	 *
	 * For
	 *   - Unfinished: WithoutViolations
	 *   - Unknown: Unfinished
	 *   - WithViolations: _usually not disabled, kept as is_
	 *   - WithoutViolations: _usually not disabled, kept as is_
	 *   - Missing: _usually not disabled, kept as is_
	 *
	 * @param status
	 */
	selectNextBestValue( status: ContributionSurveyRowStatus ) {
		const menu = this.statusDropdown.getMenu();

		if ( status === ContributionSurveyRowStatus.Unfinished ) {
			menu.selectItemByData( ContributionSurveyRowStatus.WithoutViolations );
		} else if ( status === ContributionSurveyRowStatus.Unknown ) {
			menu.selectItemByData( ContributionSurveyRowStatus.Unfinished );
		}
	}

}
