import { h } from 'tsx-dom';
import DeputyCasePage, { ContributionSurveyHeading } from '../wiki/DeputyCasePage';
import { DeputyUIElement } from './DeputyUIElement';
import unwrapWidget from '../util/unwrapWidget';
import DeputyContributionSurveyRow from './DeputyContributionSurveyRow';
import ContributionSurveyRow from '../models/ContributionSurveyRow';
import normalizeTitle from '../util/normalizeTitle';

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
	originalList: HTMLElement;

	// UI elements (no OOUI types, fall back to `any`)
	container: HTMLElement;
	rows: DeputyContributionSurveyRow[];
	closingCheckbox: any;
	closingComments: any;
	cancelButton: any;
	reviewButton: any;
	saveButton: any;

	/**
	 * A collection of strings or DeputyContributionSurveyRows. Used to build the
	 * section wikitext in a manner that preserves all non-CSR lines.
	 */
	wikitextLines: ( DeputyContributionSurveyRow | string )[];

	/**
	 * @return `true` if this section is (or will be) closed
	 */
	get closed(): boolean {
		return this.closingCheckbox?.isSelected() ?? false;
	}

	/**
	 * @return The closing comments for this section
	 */
	get comments(): string {
		return this.closingComments?.getValue() ?? '';
	}

	/**
	 * @return The wikitext for this section.
	 */
	get wikitext(): string {
		const final: string[] = [];

		for ( const obj of this.wikitextLines ) {
			if ( typeof obj === 'string' ) {
				final.push( obj );
			} else {
				final.push( obj.wikitext );
			}
		}

		if ( this.closed ) {
			// TODO: Wiki localization
			final.splice( 1, 0, `{{collapse top|${( this.comments + ' ~~~~' ).trim()}}}` );
			final.push( '{{collapse bottom}}' );
		}

		return final.join( '\n' );
	}

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
		this.originalList = firstList.parentElement.removeChild( firstList ) as HTMLElement;

		const rowElements: Record<string, HTMLLIElement> = {};
		for ( let i = 0; i < this.originalList.children.length; i++ ) {
			const li = this.originalList.children.item( i );
			if ( li.tagName !== 'LI' ) {
				return;
			}
			const anchor: HTMLElement = li.querySelector( 'a:first-of-type' );

			rowElements[ new mw.Title( anchor.innerText ).getPrefixedText() ] = li as HTMLLIElement;
		}

		const headingName = this.casePage.parsoid ?
			this.heading.innerText :
			( this.heading.querySelector( '.mw-headline' ) as HTMLElement ).innerText;
		const sectionWikitext = await this.casePage.wikitext.getSectionWikitext( headingName );

		const wikitextLines = sectionWikitext.split( '\n' );
		this.rows = [];
		this.wikitextLines = [];
		for ( let i = 0; i < wikitextLines.length; i++ ) {
			const line = wikitextLines[ i ];

			let rowElement;
			if ( line.startsWith( '*' ) ) {
				const csr = new ContributionSurveyRow( line );
				rowElement = new DeputyContributionSurveyRow(
					csr, rowElements[ csr.title.getPrefixedText() ], this
				);
			} else {
				rowElement = line;
			}
			if ( typeof rowElement !== 'string' ) {
				this.rows.push( rowElement );
			}
			this.wikitextLines.push( rowElement );
		}
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
		this.reviewButton = new OO.ui.ButtonWidget( {
			label: mw.message( 'deputy.review' ).text()
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

		( window as any ).test = this;

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
					{ unwrapWidget( this.reviewButton ) }
					{ unwrapWidget( this.saveButton ) }
				</div>
			</div>
		</div> as HTMLElement;
	}

}
