import { h } from 'tsx-dom';
import DeputyCasePage, { ContributionSurveyHeading } from '../wiki/DeputyCasePage';
import { DeputyUIElement } from './DeputyUIElement';
import unwrapWidget from '../util/unwrapWidget';
import DeputyContributionSurveyRow from './DeputyContributionSurveyRow';
import ContributionSurveyRow from '../models/ContributionSurveyRow';

/**
 * The contribution survey section UI element. This includes a list of revisions
 * (which are {@link DeputyContributionSurveyRow} objects), a "close section"
 * checkbox, a "comments" input box (for additional comments when closing the
 * section), a "cancel" button and a "save" button.
 */
export default class DeputyContributionSurveySection implements DeputyUIElement {

	casePage: DeputyCasePage;
	heading: HTMLHeadingElement;
	sectionElements: HTMLElement[];

	// UI elements (no OOUI types, fall back to `any`)
	container: HTMLElement;
	rows: DeputyContributionSurveyRow[];
	closingCheckbox: any;
	closingComments: any;
	cancelButton: any;
	saveButton: any;

	/**
	 * Creates a DeputyContributionSurveySection from a given heading.
	 *
	 * @param casePage
	 * @param heading
	 */
	constructor( casePage: DeputyCasePage, heading: ContributionSurveyHeading ) {
		this.casePage = casePage;
		this.heading = heading;
		this.sectionElements = casePage.getContributionSurveySection( heading );
	}

	/**
	 * Perform any required pre-render operations.
	 */
	async prepare(): Promise<void> {
		const firstList = this.sectionElements.find( ( el ) => el.tagName === 'UL' );
		firstList.parentElement.removeChild( firstList );

		const headingName = this.casePage.parsoid ?
			this.heading.innerText :
			( this.heading.querySelector( '.mw-headline' ) as HTMLElement ).innerText;
		const sectionWikitext = await this.casePage.wikitext.getSectionWikitext( headingName );

		const wikitextRows = sectionWikitext.split( '\n' ).filter( ( v ) => v.startsWith( '*' ) );
		this.rows = wikitextRows.map( ( rowText ) => new DeputyContributionSurveyRow(
			new ContributionSurveyRow( rowText ), this
		) );
	}

	/**
	 * Toggles the closing comments input box. This will disable the input box AND
	 * hide the element from view.
	 *
	 * @param show
	 */
	toggleClosingComments( show: boolean ) {
		this.closingComments.setDisabled( !show );
		this.closingComments.toggle( show );
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		this.closingCheckbox = new OO.ui.CheckboxInputWidget();
		this.closingComments = new OO.ui.TextInputWidget( {
			placeholder: mw.message( 'deputy.session.section.closeComments' ).text(),
			disabled: true
		} );
		this.cancelButton = new OO.ui.ButtonWidget( {
			label: mw.message( 'deputy.cancel' ).text()
		} );
		this.saveButton = new OO.ui.ButtonWidget( {
			label: mw.message( 'deputy.save' ).text(),
			flags: [ 'primary', 'progressive' ]
		} );

		const closingCommentsField = new OO.ui.FieldLayout( this.closingComments, {
			align: 'top',
			label: 'Closing comments',
			invisibleLabel: true,
			help: mw.message( 'deputy.session.section.closeHelp' ).text(),
			helpInline: true,
			classes: [ 'dp-cs-section-closingCommentsField' ]
		} );
		// Hide by default.
		closingCommentsField.toggle( false );

		this.toggleClosingComments( false );
		this.closingCheckbox.on( 'change', ( v: boolean ) => {
			closingCommentsField.toggle( v );
			this.toggleClosingComments( v );
		} );

		return this.container = <div class="deputy dp-cs-section">
			<div>
				{ this.rows.map( ( row ) => row.render() ) }
			</div>
			<div style={{ display: 'flex', padding: '8px' }}>
				<div style={{
					flex: '1',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center'
				}}>
					{ unwrapWidget( new OO.ui.FieldLayout( this.closingCheckbox, {
						align: 'inline',
						label: mw.message( 'deputy.session.section.close' ).text()
					} ) ) }
					{ unwrapWidget( closingCommentsField ) }
				</div>
				<div style={{ display: 'flex', alignItems: 'end' }}>
					{ unwrapWidget( this.cancelButton ) }
					{ unwrapWidget( this.saveButton ) }
				</div>
			</div>
		</div> as HTMLElement;
	}

}
