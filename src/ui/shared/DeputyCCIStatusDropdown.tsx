import '../../types';
import { ContributionSurveyRowStatus } from '../../models/ContributionSurveyRow';
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
	/**
	 * Extra options for the DropdownWidget.
	 */
	widgetOptions?: string[]
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
	row: {
		casePage: DeputyCasePage,
		title: mw.Title
	};
	/**
	 * The OOUI DropdownWidget element. This does <b>not</b> use DropdownInputWidget
	 * due to its lack of support for icons in dropdown menu options and the ability
	 * to hide said icons using CSS and other fun trickery.
	 */
	dropdown: any;
	/**
	 * A set of OOUI MenuOptionWidgets that make up the status dropdown.
	 */
	options: Map<ContributionSurveyRowStatus, any>;
	/**
	 * A listener that listens to changes in the status dropdown and performs respective
	 * updates and changes.
	 */
	statusDropdownChangeListener: ( items: any[] ) => void;

	/**
	 * @return The currently-selected status of this dropdown.
	 */
	get status(): ContributionSurveyRowStatus {
		return this.dropdown.getMenu().findSelectedItem()?.getData() ?? null;
	}
	/**
	 * Sets the currently-selected status of this dropdown.
	 */
	set status( status: ContributionSurveyRowStatus ) {
		this.dropdown.getMenu().selectItemByData( status );
		this.setOptionDisabled(
			ContributionSurveyRowStatus.Unknown,
			status !== ContributionSurveyRowStatus.Unknown,
			true
		);
		this.refresh();
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
		this.row = row;
		this.options = new Map();

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
			this.options.set( +status, option );
		}

		this.dropdown = new OO.ui.DropdownWidget( Object.assign(
			{
				classes: [ 'dp-cs-row-status' ],
				label: mw.message( 'deputy.session.row.status' ).text()
			},
			options.widgetOptions ?? {},
			{
				menu: {
					items: Array.from( this.options.values() )
				}
			}
		) );

		// Place before event listeners to prevent them from firing too early.
		if ( options.status != null ) {
			this.status = options.status;
		}
		if ( options.enabled != null ) {
			this.setEnabledOptions( options.enabled );
		}

		this.statusDropdownChangeListener = ( () => {
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
		} );

		// Change the icon of the dropdown when the value changes.
		this.dropdown.getMenu().on( 'select', this.statusDropdownChangeListener );
		// Make the menu larger than the actual dropdown.
		this.dropdown.getMenu().on( 'ready', () => {
			this.dropdown.getMenu().toggleClipping( false );
			unwrapWidget( this.dropdown.getMenu() ).style.width = '20em';
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
	 * Refreshes the status dropdown for any changes. This function must NOT
	 * modify `this.status`, or else it will cause a stack overflow.
	 */
	refresh(): void {
		const icon = DeputyCCIStatusDropdown.menuOptionIcons[ this.status ];
		this.dropdown.setIcon( icon === false ? null : icon );
	}

	/**
	 *
	 * @param enabledOptions
	 * @param broadcast
	 */
	setEnabledOptions( enabledOptions: ContributionSurveyRowStatus[], broadcast = false ) {
		for ( const status in ContributionSurveyRowStatus ) {
			const option = this.options.get( +status );
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
		this.dropdown.setDisabled( disabled );
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
			this.options.get( status ).toggle( disabled );
		} else {
			// Disable the disable flag.
			this.options.get( status ).setDisabled( disabled );
		}
		if ( this.status === status && disabled ) {
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
	 * @param status The status that was <b>changed into</b>
	 */
	selectNextBestValue( status: ContributionSurveyRowStatus ) {
		if ( status === ContributionSurveyRowStatus.Unfinished ) {
			this.status = ContributionSurveyRowStatus.WithoutViolations;
		} else if ( status === ContributionSurveyRowStatus.Unknown ) {
			this.status = ContributionSurveyRowStatus.Unfinished;
		}
	}

}
