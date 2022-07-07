import { h } from 'tsx-dom';
import DeputyCasePage, { ContributionSurveyHeading } from '../wiki/DeputyCasePage';
import { DeputyUIElement } from './DeputyUIElement';
import unwrapWidget from '../util/unwrapWidget';
import DeputyContributionSurveyRow from './DeputyContributionSurveyRow';
import ContributionSurveyRow from '../models/ContributionSurveyRow';
import ContributionSurveySection from '../models/ContributionSurveySection';
import DeputyReviewDialog from './DeputyReviewDialog';
import swapElements from '../util/swapElements';
import sectionHeadingName from '../util/sectionHeadingName';

/**
 * The contribution survey section UI element. This includes a list of revisions
 * (which are {@link DeputyContributionSurveyRow} objects), a "close section"
 * checkbox, a "comments" input box (for additional comments when closing the
 * section), a "cancel" button and a "save" button.
 */
export default class DeputyContributionSurveySection implements DeputyUIElement {

	casePage: DeputyCasePage;
	private _section: ContributionSurveySection;
	heading: HTMLHeadingElement;
	sectionElements: HTMLElement[];
	originalList: HTMLElement;

	// UI elements (no OOUI types, fall back to `any`)
	container: HTMLElement;
	rows: DeputyContributionSurveyRow[];
	closingCheckbox: any;
	closingComments: any;
	closeButton: any;
	reviewButton: any;
	saveButton: any;

	/**
	 * A collection of strings or DeputyContributionSurveyRows. Used to build the
	 * section wikitext in a manner that preserves all non-CSR lines.
	 */
	wikitextLines: ( DeputyContributionSurveyRow | string )[];

	/**
	 * @return `true` if this section has been modified
	 */
	get modified(): boolean {
		return this.rows && this.rows.length > 0 &&
			this.rows.some( ( row ) => row.modified ) || (
			this._section && this._section.originallyClosed !== this.closed
		);
	}

	/**
	 * @return `true` if this section is (or will be) closed
	 */
	get closed(): boolean {
		return this._section?.closed;
	}
	/**
	 * Sets the close state of this section
	 */
	set closed( value: boolean ) {
		if ( this._section?.closed == null ) {
			throw new Error( 'Section has not been loaded yet.' );
		}
		this._section.closed = value;
	}

	/**
	 * @return The closing comments for this section
	 */
	get comments(): string {
		return this._section?.closingComments;
	}
	/**
	 * Sets the comments of a section.
	 */
	set comments( value: string ) {
		if ( this._section?.closingComments == null ) {
			throw new Error( 'Section has not been loaded yet.' );
		}
		this._section.closingComments = value;
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
			final.splice( 1, 0, `{{collapse top|${
				( ( this.comments ?? '' ) + ' ~~~~' ).trim()
			}}}` );

			if ( final[ final.length - 1 ].trim().length === 0 ) {
				final.pop();
			}
			final.push( '{{collapse bottom}}' );
		}

		return final.join( '\n' );
	}

	/**
	 * @return The edit summary for this section's changes.
	 */
	get editComment(): string {
		// TODO: Wiki localization
		// Not i18n, since this is dependent on the wiki content language.
		if ( this.modified ) {
			const modified = this.rows.filter( ( row ) => row.modified );
			let worked = 0;
			let assessed = 0;
			let finished = 0;
			let reworked = 0;

			for ( const row of modified ) {
				if ( !row.wasFinished ) {
					worked++;
					assessed += row.revisions.find( ( rev ) => rev.done ).length;
					if ( row.row.completed ) {
						finished++;
					}
				} else {
					reworked++;
				}
			}

			const message: string[] = [];
			if ( assessed > 0 ) {
				message.push( `${assessed} revisions assessed across ${worked} pages` );
			}
			if ( finished > 0 ) {
				message.push( `${finished} pages finished` );
			}
			if ( reworked > 0 ) {
				message.push( `${reworked} pages reworked` );
			}

			return 'Assessed ' + message.join( '; ' );
		} else {
			return 'Reformatting section';
		}
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
	 * Get the ContributionSurveySection for this section
	 */
	async getSection(): Promise<ContributionSurveySection> {
		const collapsible = this.sectionElements.find(
			( v: HTMLElement ) => v.querySelector( '.mw-collapsible' )
		)?.querySelector( '.mw-collapsible' ) ?? null;

		const headingName = sectionHeadingName( this.heading );
		const sectionWikitext = await this.casePage.wikitext.getSectionWikitext( headingName );

		return this._section ?? (
			this._section = new ContributionSurveySection(
				this.casePage,
				sectionHeadingName( this.heading ),
				collapsible != null,
				collapsible?.querySelector<HTMLElement>( '.mw-collapsible-toggle + div' ).innerText,
				sectionWikitext
			)
		);
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

		const sectionWikitext = ( await this.getSection() ).originalWikitext;

		const wikitextLines = sectionWikitext.split( '\n' );
		this.rows = [];
		this.wikitextLines = [];
		for ( let i = 0; i < wikitextLines.length; i++ ) {
			const line = wikitextLines[ i ];

			let rowElement;
			if ( line.startsWith( '*' ) ) {
				const csr = new ContributionSurveyRow( this.casePage, line );
				rowElement = new DeputyContributionSurveyRow(
					csr, rowElements[ csr.title.getPrefixedText() ], line, this
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
	 * Destroys the element from the DOM and re-inserts in its place the original list.
	 * This *should* return the section back to its original look. This does *NOT*
	 * remove the section from the session or cache. Use `DeputySession.closeSection`
	 * instead.
	 */
	async close(): Promise<void> {
		swapElements( this.container, this.originalList );
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
		this.closeButton = new OO.ui.ButtonWidget( {
			label: mw.message( 'deputy.close' ).text()
		} );
		this.reviewButton = new OO.ui.ButtonWidget( {
			label: mw.message( 'deputy.review' ).text()
		} );
		this.saveButton = new OO.ui.ButtonWidget( {
			label: mw.message( 'deputy.save' ).text(),
			flags: [ 'primary', 'progressive' ]
		} );

		this.closeButton.on( 'click', async () => {
			if ( this.wikitext !== ( await this.getSection() ).originalWikitext ) {
				OO.ui.confirm(
					mw.message( 'deputy.session.section.closeWarn' ).text()
				).done( ( confirmed: boolean ) => {
					if ( confirmed ) {
						this.close().then( () => {
							window.deputy.session.closeSection( this );
						} );
					}
				} );
			} else {
				await this.close();
				await window.deputy.session.closeSection( this );
			}
		} );

		this.reviewButton.on( 'click', async () => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const reviewDialog = DeputyReviewDialog( {
				from: ( await this.getSection() ).originalWikitext,
				to: this.wikitext,
				title: this.casePage.title
			} );
			window.deputy.windowManager.addWindows( [ reviewDialog ] );
			window.deputy.windowManager.openWindow( reviewDialog );
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
		closingCommentsField.on( 'change', ( v: string ) => {
			this.comments = v;
		} );

		this.toggleClosingComments( false );
		this.closingCheckbox.on( 'change', ( v: boolean ) => {
			this.closed = v;
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
					{ unwrapWidget( this.closeButton ) }
					{ unwrapWidget( this.reviewButton ) }
					{ unwrapWidget( this.saveButton ) }
				</div>
			</div>
		</div> as HTMLElement;
	}

}
