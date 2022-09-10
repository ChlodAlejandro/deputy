import '../../../types';
import { blockExit, unblockExit } from '../../../util/blockExit';
import normalizeTitle from '../../../wiki/util/normalizeTitle';
import MwApi from '../../../MwApi';
import getObjectValues from '../../../util/getObjectValues';
import { h } from 'tsx-dom';
import CopyrightProblemsPage from '../models/CopyrightProblemsPage';
import unwrapWidget from '../../../util/unwrapWidget';
import decorateEditSummary from '../../../wiki/util/decorateEditSummary';

export interface SinglePageWorkflowDialogData {
	page: string | mw.Title;
	revid: number;
}

/**
 * A MediaWiki section.
 */
interface Section {
	/** The section's positional index. */
	i: number;
	toclevel: number;
	level: string;
	/** Actual section title */
	line: string;
	/** The TOC number of this section. */
	number: string;
	index: string;
	byteoffset: number|null;
	/** Anchor that links to this section */
	anchor: string;
	/** Page that contains this section, if not on the current page. */
	fromtitle?: string;
}

interface SinglePageWorkflowDialogResponseData {
	entirePage: boolean;

	startSection?: Section;
	endSection?: Section;
	startOffset?: number;
	endOffset?: number;

	/**
	 * Determines which source mode to use. If `fromUrls` is true, `sourceUrls` will be
	 * used for the source. Otherwise, `sourceText` is used.
	 */
	fromUrls: boolean;
	sourceUrls?: string[];
	sourceText: string;

	/**
	 * Additional notes.
	 */
	notes: string;
}

let InternalSinglePageWorkflowDialog: any;

/**
 * Initializes the process element.
 */
function initSinglePageWorkflowDialog() {
	InternalSinglePageWorkflowDialog = class SinglePageWorkflowDialog extends OO.ui.ProcessDialog {

		// For dialogs. Remove if not a dialog.
		static static = {
			name: 'iaSinglePageWorkflowDialog',
			title: mw.message( 'deputy.ia' ).text(),
			actions: [
				{
					action: 'close',
					label: mw.message( 'deputy.close' ).text(),
					flags: 'safe'
				}
			]
		};

		data: Partial<SinglePageWorkflowDialogResponseData> = {
			entirePage: true,
			fromUrls: true
		};

		page: mw.Title;
		revid: number;
		inputs: Record<string, any>;
		/** The wikitext */
		wikitext: string;
		/** External links in this revision */
		externalLinks: string[];
		/** Sections in this revision */
		sections: Section[];

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: SinglePageWorkflowDialogData ) {
			super();

			this.page = normalizeTitle( config.page );
			this.revid = config.revid;
		}

		/**
		 * @return The body height of this dialog.
		 */
		getBodyHeight(): number {
			return 500;
		}

		/**
		 * Initializes the dialog.
		 */
		initialize() {
			super.initialize();

			const intro = <div
				class="ia-report-intro"
				dangerouslySetInnerHTML={
					mw.message(
						'deputy.ia.report.intro',
						CopyrightProblemsPage.getCurrentListingPage().getPrefixedText()
					).parse()
				}
			/>;
			this.fieldsetLayout = new OO.ui.FieldsetLayout( {
				items: this.renderFields()
			} );

			this.$body.append( new OO.ui.PanelLayout( {
				expanded: false,
				framed: false,
				padded: true,
				content: [
					intro,
					this.fieldsetLayout,
					this.renderSubmitButton()
				]
			} ).$element );
		}

		/**
		 * @return A JSX.Element
		 */
		renderSubmitButton(): JSX.Element {
			const hideButton = new OO.ui.ButtonWidget( {
				label: mw.message( 'deputy.ia.report.hide' ).text(),
				title: mw.message( 'deputy.ia.report.hide' ).text(),
				flags: [ 'progressive' ]
			} );

			hideButton.on( 'click', () => {
				this.executeAction( 'hide' );
			} );

			const submitButton = new OO.ui.ButtonWidget( {
				label: mw.message( 'deputy.ia.report.submit' ).text(),
				title: mw.message( 'deputy.ia.report.submit' ).text(),
				flags: [ 'primary', 'progressive' ]
			} );

			submitButton.on( 'click', () => {
				this.executeAction( 'submit' );
			} );

			return <div class="ia-report-submit">
				{ unwrapWidget( hideButton ) }
				{ unwrapWidget( submitButton ) }
			</div>;
		}

		/**
		 * Render OOUI FieldLayouts to be appended to the fieldset layout.
		 *
		 * @return An array of OOUI `FieldsetLayout`s
		 */
		renderFields(): any[] {
			const entirePageByDefault = this.data.entirePage;

			this.inputs = {
				entirePage: new OO.ui.CheckboxInputWidget( {
					selected: entirePageByDefault
				} ),
				startSection: new OO.ui.DropdownInputWidget( {
					$overlay: this.$overlay,
					disabled: entirePageByDefault,
					placeholder: mw.message(
						'deputy.ia.report.startSection.placeholder'
					).text()
				} ),
				endSection: new OO.ui.DropdownInputWidget( {
					$overlay: this.$overlay,
					disabled: entirePageByDefault,
					placeholder: mw.message(
						'deputy.ia.report.endSection.placeholder'
					).text()
				} ),
				fromUrls: new OO.ui.CheckboxInputWidget( {
					selected: this.data.fromUrls
				} ),
				sourceUrls: new OO.ui.MenuTagMultiselectWidget( {
					$overlay: this.$overlay,
					allowArbitrary: true,
					inputPosition: 'outline',
					indicators: [ 'required' ],
					placeholder: mw.message(
						'deputy.ia.report.sourceUrls.placeholder'
					).text()
				} ),
				sourceText: new OO.ui.MultilineTextInputWidget( {
					autosize: true,
					maxRows: 2,
					placeholder: mw.message(
						'deputy.ia.report.sourceText.placeholder'
					).text()
				} ),
				additionalNotes: new OO.ui.MultilineTextInputWidget( {
					autosize: true,
					maxRows: 2,
					placeholder: mw.message(
						'deputy.ia.report.additionalNotes.placeholder'
					).text()
				} )
			};

			const fields = {
				entirePage: new OO.ui.FieldLayout( this.inputs.entirePage, {
					align: 'inline',
					label: mw.message( 'deputy.ia.report.entirePage.label' ).text()
				} ),
				startSection: new OO.ui.FieldLayout( this.inputs.startSection, {
					align: 'top',
					label: mw.message( 'deputy.ia.report.startSection.label' ).text()
				} ),
				// Create FieldLayouts for all fields in this.inputs
				endSection: new OO.ui.FieldLayout( this.inputs.endSection, {
					align: 'top',
					label: mw.message( 'deputy.ia.report.endSection.label' ).text(),
					help: mw.message( 'deputy.ia.report.endSection.help' ).text()
				} ),
				fromUrls: new OO.ui.FieldLayout( this.inputs.fromUrls, {
					align: 'inline',
					label: mw.message( 'deputy.ia.report.fromUrls.label' ).text(),
					help: mw.message( 'deputy.ia.report.fromUrls.help' ).text()
				} ),
				sourceUrls: new OO.ui.FieldLayout( this.inputs.sourceUrls, {
					align: 'top',
					label: mw.message( 'deputy.ia.report.source.label' ).text()
				} ),
				sourceText: new OO.ui.FieldLayout( this.inputs.sourceText, {
					align: 'top',
					label: mw.message( 'deputy.ia.report.source.label' ).text()
				} ),
				additionalNotes: new OO.ui.FieldLayout( this.inputs.additionalNotes, {
					align: 'top',
					label: mw.message( 'deputy.ia.report.additionalNotes.label' ).text()
				} )
			};

			this.inputs.entirePage.on( 'change', ( selected: boolean ) => {
				if ( selected === undefined ) {
					// Bad firing.
					return;
				}
				this.data.entirePage = selected;

				this.inputs.startSection.setDisabled( selected );
				this.inputs.endSection.setDisabled( selected );
			} );

			const entirePageHiddenCheck = () => {
				if (
					this.inputs.startSection.getValue() === '-1' &&
					this.inputs.endSection.getValue() === `${this.sections.length - 1}`
				) {
					this.inputs.entirePage.setSelected( true );
				}
			};

			const thisTitle = this.page.getPrefixedDb();
			this.inputs.startSection.on( 'change', ( value: string ) => {
				const section = value === '-1' ? null : this.sections[ +value ];

				this.data.startSection = section;
				this.data.startOffset = section == null ? 0 : section.byteoffset;

				// Automatically lock out sections before the start in the end dropdown
				for ( const item of this.inputs.endSection.dropdownWidget.menu.items ) {
					if ( item.data === '-1' ) {
						item.setDisabled( value !== '-1' );
					} else if ( this.sections[ item.data ].fromtitle === thisTitle ) {
						if ( this.sections[ item.data ].i < +value ) {
							item.setDisabled( true );
						} else {
							item.setDisabled( false );
						}
					}
				}

				entirePageHiddenCheck();
			} );

			this.inputs.endSection.on( 'change', ( value: string ) => {
				const section = value === '-1' ? null : this.sections[ +value ];

				this.data.endSection = section;
				// Find the section directly after this one, or if null (or last section), use the
				// end of the page for it.
				this.data.endOffset = section == null ?
					this.sections[ 0 ].byteoffset :
					( this.sections[ section.i + 1 ]?.byteoffset ?? this.wikitext.length );

				// Automatically lock out sections before the end in the start dropdown
				for ( const item of this.inputs.startSection.dropdownWidget.menu.items ) {
					if ( item.data === '-1' ) {
						item.setDisabled( value === '-1' );
					} else if ( this.sections[ item.data ].fromtitle === thisTitle ) {
						if ( this.sections[ item.data ].i > +value ) {
							item.setDisabled( true );
						} else {
							item.setDisabled( false );
						}
					}
				}

				entirePageHiddenCheck();
			} );

			this.inputs.fromUrls.on( 'change', ( selected: boolean = this.data.fromUrls ) => {
				if ( selected === undefined ) {
					// Bad firing.
					return;
				}

                this.data.fromUrls = selected;
				fields.sourceUrls.toggle( selected );
				fields.sourceText.toggle( !selected );
			} );

			this.inputs.sourceUrls.on( 'change', ( items: { data: string }[] ) => {
				this.data.sourceUrls = items.map( ( item ) => item.data );
			} );
			this.inputs.sourceText.on( 'change', ( text: string ) => {
				this.data.sourceText = text.replace(/\.\s*$/, "");
			} );
			fields.sourceText.toggle( false );

			this.inputs.additionalNotes.on( 'change', ( text: string ) => {
				this.data.notes = text;
			} );

			return getObjectValues( fields );
		}

		/**
		 * Generate options from the section set.
		 *
		 * @return An array of DropdownInputWidget options
		 */
		generateSectionOptions(): any {
			const thisTitle = this.page.getPrefixedDb();

			const options: any[] = [];
			this.sections.forEach( ( section ) => {
				options.push( {
					data: section.i,
					label: mw.message(
						'deputy.ia.report.section',
						section.number,
						section.line
					).text(),
					...( section.fromtitle !== thisTitle ? {
						disabled: true,
						title: mw.message(
							'deputy.ia.report.transcludedSection',
							section.fromtitle
						).text()
					} : {} )
				} );
			} );
			return options;
		}

		/**
		 * @param data
		 * @return An OOUI Process
		 */
		getSetupProcess( data: any ): any {
			const process = super.getSetupProcess.call( this, data );

			process.next( MwApi.action.get( {
				action: 'parse',
				...( this.revid ? { oldid: this.revid } : { page: this.page.getPrefixedText() } ),
				prop: 'externallinks|sections|wikitext'
			} ).then( ( res ) => {
				this.externalLinks = res.parse.externallinks ?? [];
				this.sections = res.parse.sections?.map(
					( v: Section, k: number ) => Object.assign( v, { i: k } )
				) ?? [];
				this.wikitext = res.parse.wikitext;

				const options = [
					{
						data: '-1',
						label: mw.message( 'deputy.ia.report.lead' ).text(),
						selected: true
					},
					...this.generateSectionOptions()
				];
				this.inputs.startSection.setOptions( options );
				this.inputs.endSection.setOptions( options );

				this.inputs.sourceUrls.menu.clearItems();
				this.inputs.sourceUrls.addOptions(
					this.externalLinks.map( ( v ) => ( { data: v, label: v } ) )
				);
			} ) );

			process.next( () => {
				blockExit( 'ia-spwd' );
			} );

			return process;
		}

		/**
		 * Hides the page content.
		 */
		async hideContent(): Promise<void> {
			let finalPageContent;

			// TODO: l10n
			const copyvioWikitext = `{{subst:copyvio|url=${
				this.data.fromUrls ? this.data.sourceUrls[ 0 ] : this.data.sourceText
			}|fullpage=${
				this.data.entirePage ? 'true' : 'false'
			}}}`;

			if ( this.data.entirePage ) {
				finalPageContent = copyvioWikitext + '\n' + this.wikitext;
			} else {
				finalPageContent =
					this.wikitext.slice( 0, this.data.startOffset ) +
					copyvioWikitext + '\n' +
					this.wikitext.slice( this.data.startOffset, this.data.endOffset ) +
					'{{subst:copyvio/bottom}}\n' +
					this.wikitext.slice( this.data.endOffset );
			}

			await MwApi.action.postWithEditToken( {
				action: 'edit',
				title: this.page.getPrefixedText(),
				text: finalPageContent,
				// TODO: l10n
				summary: decorateEditSummary(
					this.data.entirePage ?
						'Hiding page content due to a suspected or complicated copyright issue' :
						`Hiding sections [[${
							this.page.getPrefixedText()
						}#${
							this.data.startSection.anchor
						}|${
							this.data.startSection.line
						}]] to [[${
							this.page.getPrefixedText()
						}#${
							this.data.endSection.anchor
						}|${
							this.data.endSection.line
						}]] for suspected or complicated copyright issues`
				)
			} );
		}

		/**
		 * Posts a listing to the current copyright problems listing page.
		 */
		async postListing(): Promise<void> {
			// TODO: l10n
			const from =
				this.data.fromUrls ?
					this.data.sourceUrls.map(
						( v, i ) => `${
							i === this.data.sourceUrls.length - 1 && i > 0 ? 'and ' : ''
						}[${v}]`
					).join( this.data.sourceUrls.length > 2 ? ', ' : ' ' ) :
					this.data.sourceText;
			const comments = `${
				( from || '' ).trim().length !== 0 ? 'from ' + from + '. ' : ''
			}${
				this.data.notes
			}`;

			await CopyrightProblemsPage.getCurrent()
				.postListing( this.page, comments );
		}

		/**
		 * @param action
		 * @return An OOUI Process
		 */
		getActionProcess( action: string ): any {
			const process = super.getActionProcess.call( this, action );

			if ( action === 'submit' ) {
				process.next( this.postListing() );
			}
			if ( action === 'submit' || action === 'hide' ) {
				process.next( this.hideContent() );
				process.next( () => {
					mw.notify(
						action === 'hide' ?
							mw.message( 'deputy.ia.report.success.hide' ).text() :
							mw.message( 'deputy.ia.report.success' ).text(),
						{ type: 'success' }
					);
				} );
			}
			process.next( function () {
				unblockExit( 'ia-spwd' );
				this.close( { action: action } );

				// Reload the page
				// TODO: Preferences
				window.location.reload();
			}, this );

			return process;
		}

		/**
		 * @param data
		 * @return An OOUI Process
		 */
		getTeardownProcess( data: any ): any {
			/** @member any */
			return super.getTeardownProcess.call( this, data );
		}

	};

}

/**
 * Creates a new SinglePageWorkflowDialog.
 *
 * @param config Configuration to be passed to the element.
 * @return A SinglePageWorkflowDialog object
 */
export default function ( config: SinglePageWorkflowDialogData ) {
	if ( !InternalSinglePageWorkflowDialog ) {
		initSinglePageWorkflowDialog();
	}
	return new InternalSinglePageWorkflowDialog( config );
}
