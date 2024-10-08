import '../../../types';
import { blockExit, unblockExit } from '../../../util/blockExit';
import normalizeTitle, { TitleLike } from '../../../wiki/util/normalizeTitle';
import MwApi from '../../../MwApi';
import getObjectValues from '../../../util/getObjectValues';
import { h } from 'tsx-dom';
import CopyrightProblemsPage from '../models/CopyrightProblemsPage';
import unwrapWidget from '../../../util/unwrapWidget';
import decorateEditSummary from '../../../wiki/util/decorateEditSummary';
import { TripleCompletionAction } from '../../shared/CompletionAction';
import equalTitle from '../../../util/equalTitle';
import msgEval from '../../../wiki/util/msgEval';
import CCICaseInputWidget from './CCICaseInputWidget';
import changeTag from '../../../config/changeTag';
import unwrapJQ from '../../../util/unwrapJQ';

export interface SinglePageWorkflowDialogData {
	page: TitleLike;
	revid?: number;
	/**
	 * If `false`, no shadowing options will be provided (hide content only, etc.)
	 *
	 * @default true
	 */
	shadow?: boolean;
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
	 * Determines whether sources are used entirely. If true, sources are NOT
	 * used. If false, sources are used. This also changes used content strings.
	 */
	presumptive: boolean;
	presumptiveCase: string;

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
			...OO.ui.ProcessDialog.static,
			name: 'iaSinglePageWorkflowDialog',
			title: mw.msg( 'deputy.ia' ),
			actions: [
				{
					flags: [ 'safe', 'close' ],
					icon: 'close',
					label: mw.msg( 'deputy.ante.close' ),
					title: mw.msg( 'deputy.ante.close' ),
					invisibleLabel: true,
					action: 'close'
				}
			]
		};

		fieldsetLayout: OO.ui.FieldsetLayout;
		$body: JQuery;
		data: Partial<SinglePageWorkflowDialogResponseData>;

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
		 * If `false`, no shadowing options will be provided (hide content only, etc.)
		 *
		 * @default true
		 */
		shadow: boolean;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: SinglePageWorkflowDialogData ) {
			super();

			this.page = normalizeTitle( config.page );
			this.revid = config.revid;
			this.shadow = config.shadow ?? true;

			const userConfig = window.InfringementAssistant.config;
			this.data = {
				entirePage: userConfig.ia.defaultEntirePage.get(),
				fromUrls: userConfig.ia.defaultFromUrls.get()
			};
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

			const intro = unwrapJQ( <div class="ia-report-intro" />, mw.message(
				'deputy.ia.report.intro',
				CopyrightProblemsPage.getCurrentListingPage().getPrefixedText()
			).parseDom() );
			intro.querySelector( 'a' ).setAttribute( 'target', '_blank' );

			const page = unwrapJQ( <div class="ia-report-intro" />, mw.message(
				'deputy.ia.report.page',
				this.page.getPrefixedText()
			).parseDom() );
			page.querySelector( 'a' ).setAttribute( 'target', '_blank' );

			this.fieldsetLayout = new OO.ui.FieldsetLayout( {
				items: this.renderFields()
			} );

			this.$body.append( new OO.ui.PanelLayout( {
				expanded: false,
				framed: false,
				padded: true,
				content: [
					equalTitle( null, this.page ) ? '' : page,
					intro,
					this.fieldsetLayout,
					this.renderSubmitButton()
				]
			} ).$element );

			return this;
		}

		/**
		 * @return A JSX.Element
		 */
		renderSubmitButton(): JSX.Element {
			const hideButton = new OO.ui.ButtonWidget( {
				label: mw.msg( 'deputy.ia.report.hide' ),
				title: mw.msg( 'deputy.ia.report.hide' ),
				flags: [ 'progressive' ]
			} );

			hideButton.on( 'click', () => {
				this.executeAction( 'hide' );
			} );

			const submitButton = new OO.ui.ButtonWidget( {
				label: mw.msg( 'deputy.ia.report.submit' ),
				title: mw.msg( 'deputy.ia.report.submit' ),
				flags: [ 'primary', 'progressive' ]
			} );

			submitButton.on( 'click', () => {
				this.executeAction( 'submit' );
			} );

			return <div class="ia-report-submit">
				{ this.shadow && unwrapWidget( hideButton ) }
				{ unwrapWidget( submitButton ) }
			</div>;
		}

		/**
		 * Render OOUI FieldLayouts to be appended to the fieldset layout.
		 *
		 * @return An array of OOUI `FieldLayout`s
		 */
		renderFields(): OO.ui.FieldLayout[] {
			const entirePageByDefault = this.data.entirePage;

			this.inputs = {
				entirePage: new OO.ui.CheckboxInputWidget( {
					selected: entirePageByDefault
				} ),
				startSection: new OO.ui.DropdownInputWidget( {
					$overlay: this.$overlay,
					disabled: entirePageByDefault,
					title: mw.msg( 'deputy.ia.report.startSection.placeholder' )
				} ),
				endSection: new OO.ui.DropdownInputWidget( {
					$overlay: this.$overlay,
					disabled: entirePageByDefault,
					title: mw.msg( 'deputy.ia.report.endSection.placeholder' )
				} ),
				presumptive: new OO.ui.CheckboxInputWidget( {
					selected: false
				} ),
				presumptiveCase: CCICaseInputWidget( {
					allowArbitrary: false,
					required: true,
					showMissing: false,
					validateTitle: true,
					excludeDynamicNamespaces: true
				} ),
				fromUrls: new OO.ui.CheckboxInputWidget( {
					selected: this.data.fromUrls
				} ),
				sourceUrls: new OO.ui.MenuTagMultiselectWidget( {
					$overlay: this.$overlay,
					allowArbitrary: true,
					inputPosition: 'outline',
					indicator: 'required',
					placeholder: mw.msg( 'deputy.ia.report.sourceUrls.placeholder' )
				} ),
				sourceText: new OO.ui.MultilineTextInputWidget( {
					autosize: true,
					maxRows: 2,
					placeholder: mw.msg( 'deputy.ia.report.sourceText.placeholder' )
				} ),
				additionalNotes: new OO.ui.MultilineTextInputWidget( {
					autosize: true,
					maxRows: 2,
					placeholder: mw.msg( 'deputy.ia.report.additionalNotes.placeholder' )
				} )
			} as const;

			const fields = {
				entirePage: new OO.ui.FieldLayout( this.inputs.entirePage, {
					align: 'inline',
					label: mw.msg( 'deputy.ia.report.entirePage.label' )
				} ),
				startSection: new OO.ui.FieldLayout( this.inputs.startSection, {
					align: 'top',
					label: mw.msg( 'deputy.ia.report.startSection.label' )
				} ),
				// Create FieldLayouts for all fields in this.inputs
				endSection: new OO.ui.FieldLayout( this.inputs.endSection, {
					align: 'top',
					label: mw.msg( 'deputy.ia.report.endSection.label' ),
					help: mw.msg( 'deputy.ia.report.endSection.help' )
				} ),
				presumptive: new OO.ui.FieldLayout( this.inputs.presumptive, {
					align: 'inline',
					label: mw.msg( 'deputy.ia.report.presumptive.label' ),
					help: mw.msg( 'deputy.ia.report.presumptive.help' )
				} ),
				presumptiveCase: new OO.ui.FieldLayout( this.inputs.presumptiveCase, {
					align: 'top',
					label: mw.msg( 'deputy.ia.report.presumptiveCase.label' ),
					help: mw.msg( 'deputy.ia.report.presumptiveCase.help' )
				} ),
				fromUrls: new OO.ui.FieldLayout( this.inputs.fromUrls, {
					align: 'inline',
					label: mw.msg( 'deputy.ia.report.fromUrls.label' ),
					help: mw.msg( 'deputy.ia.report.fromUrls.help' )
				} ),
				sourceUrls: new OO.ui.FieldLayout( this.inputs.sourceUrls, {
					align: 'top',
					label: mw.msg( 'deputy.ia.report.source.label' )
				} ),
				sourceText: new OO.ui.FieldLayout( this.inputs.sourceText, {
					align: 'top',
					label: mw.msg( 'deputy.ia.report.source.label' )
				} ),
				additionalNotes: new OO.ui.FieldLayout( this.inputs.additionalNotes, {
					align: 'top',
					label: mw.msg( 'deputy.ia.report.additionalNotes.label' )
				} )
			} as const;

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

				// Ensure sections exist first.
				if ( this.sections.length > 0 ) {
					this.data.endSection = section;
					// Find the section directly after this one, or if null (or last section), use
					// the end of the page for it.
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
				}

				entirePageHiddenCheck();
			} );

			const enablePresumptive =
				window.InfringementAssistant.wikiConfig.ia.allowPresumptive.get() &&
				!!window.InfringementAssistant.wikiConfig.cci.rootPage.get();
			fields.presumptive.toggle( enablePresumptive );
			fields.presumptiveCase.toggle( false );
			this.inputs.presumptive.on( 'change', ( selected: boolean ) => {
				this.data.presumptive = selected;

				fields.presumptiveCase.toggle( selected );
				fields.fromUrls.toggle( !selected );
				if ( !selected ) {
					if (
						this.data.fromUrls ??
						window.InfringementAssistant.config.ia.defaultFromUrls.get()
					) {
						fields.sourceUrls.toggle( true );
						// No need to toggle sourceText, assume it is already hidden.
					} else {
						fields.sourceText.toggle( true );
						// No need to toggle sourceText, assume it is already hidden.
					}
				} else {
					fields.sourceUrls.toggle( false );
					fields.sourceText.toggle( false );
				}
			} );
			this.inputs.presumptiveCase.on( 'change', ( text: string ) => {
				this.data.presumptiveCase = text.replace(
					window.InfringementAssistant.wikiConfig.cci.rootPage.get().getPrefixedText(),
					''
				);
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
				this.data.sourceText = text.replace( /\.\s*$/, '' );
			} );

			// Presumptive deletion is default false, so no need to check for its state here.
			if ( window.InfringementAssistant.config.ia.defaultFromUrls.get() ) {
				fields.sourceText.toggle( false );
			} else {
				fields.sourceUrls.toggle( false );
			}

			this.inputs.additionalNotes.on( 'change', ( text: string ) => {
				this.data.notes = text;
			} );

			return this.shadow ? getObjectValues( fields ) : [
				fields.presumptive, fields.presumptiveCase,
				fields.fromUrls, fields.sourceUrls, fields.sourceText,
				fields.additionalNotes
			];
		}

		/**
		 * Generate options from the section set.
		 *
		 * @return An array of DropdownInputWidget options
		 */
		generateSectionOptions(): OO.ui.DropdownInputWidget.Option[] {
			const thisTitle = this.page.getPrefixedDb();

			const options: OO.ui.DropdownInputWidget.Option[] = [];
			if ( this.sections.length > 0 ) {
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
			} else {
				this.inputs.entirePage.setDisabled( true );
			}
			return options;
		}

		/**
		 * @param data
		 * @return An OOUI Process
		 */
		getSetupProcess( data: any ): OO.ui.Process {
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

				if ( this.sections.length === 0 ) {
					// No sections. Automatically use full page.
					this.data.entirePage = true;
				}

				const options = [
					{
						data: '-1',
						label: mw.msg( 'deputy.ia.report.lead' ),
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
			const wikiConfig = ( await window.InfringementAssistant.getWikiConfig() ).ia;

			const copyvioWikitext = msgEval(
				wikiConfig.hideTemplate.get(),
				{
					presumptive: this.data.presumptive ? 'true' : '',
					presumptiveCase: this.data.presumptiveCase ? 'true' : '',
					fromUrls: this.data.fromUrls ? 'true' : '',
					sourceUrls: this.data.sourceUrls ? 'true' : '',
					sourceText: this.data.sourceText ? 'true' : '',
					entirePage: this.data.entirePage ? 'true' : ''
				},
				this.data.presumptive ?
					`[[${
						window.deputy.wikiConfig.cci.rootPage.get().getPrefixedText()
					}/${this.data.presumptiveCase}]]` : (
						this.data.fromUrls ?
							( this.data.sourceUrls ?? [] )[ 0 ] ?? '' :
							this.data.sourceText
					),
				this.data.entirePage ? 'true' : 'false'
			).text();

			if ( this.data.entirePage ) {
				finalPageContent = copyvioWikitext + '\n' + this.wikitext;
				if ( wikiConfig.entirePageAppendBottom.get() ) {
					finalPageContent += '\n' + wikiConfig.hideTemplateBottom.get();
				}
			} else {
				finalPageContent =
					this.wikitext.slice( 0, this.data.startOffset ) +
					copyvioWikitext + '\n' +
					this.wikitext.slice( this.data.startOffset, this.data.endOffset ) +
					wikiConfig.hideTemplateBottom.get() + '\n' +
					this.wikitext.slice( this.data.endOffset );
			}

			await MwApi.action.postWithEditToken( {
				...changeTag( await window.InfringementAssistant.getWikiConfig() ),
				action: 'edit',
				title: this.page.getPrefixedText(),
				text: finalPageContent,
				summary: decorateEditSummary(
					this.data.entirePage ?
						mw.msg(
							this.data.presumptive ?
								'deputy.ia.content.hideAll.pd' :
								'deputy.ia.content.hideAll',
							// Only ever used if presumptive is set.
							...( this.data.presumptive ? [
								window.InfringementAssistant.wikiConfig
									.cci.rootPage.get().getPrefixedText(),
								this.data.presumptiveCase
							] : [] )
						) :
						mw.msg(
							this.data.presumptive ?
								'deputy.ia.content.hideAll.pd' :
								'deputy.ia.content.hide',
							this.page.getPrefixedText(),
							this.data.startSection?.anchor,
							this.data.startSection?.line,
							this.data.endSection?.anchor,
							this.data.endSection?.line,
							...( this.data.presumptive ? [
								window.InfringementAssistant.wikiConfig
									.cci.rootPage.get().getPrefixedText(),
								this.data.presumptiveCase
							] : [] )
						),
					window.InfringementAssistant.config
				)
			} );
		}

		/**
		 * Posts a listing to the current copyright problems listing page.
		 */
		async postListing(): Promise<void> {
			const sourceUrls = this.data.sourceUrls ?? [];
			const from =
				this.data.fromUrls ?
					sourceUrls
						.map( ( v ) => `[${v}]` )
						.join(
							sourceUrls.length > 2 ?
								mw.msg( 'deputy.comma-separator' ) :
								' '
						) :
					this.data.sourceText;
			const comments = ( from || '' ).trim().length !== 0 || this.data.presumptive ?
				mw.format( mw.msg(
					this.data.presumptive ?
						'deputy.ia.content.listingComment.pd' :
						'deputy.ia.content.listingComment',
					...( this.data.presumptive ? [
						window.InfringementAssistant.wikiConfig
							.cci.rootPage.get().getPrefixedText(),
						this.data.presumptiveCase
					] : [ from ] ),
					this.data.notes ?? ''
				) ) :
				this.data.notes ?? '';

			await CopyrightProblemsPage.getCurrent()
				.postListing( this.page, comments, this.data.presumptive );
		}

		/**
		 * @param action
		 * @return An OOUI Process
		 */
		getActionProcess( action: string ): OO.ui.Process {
			const process = super.getActionProcess.call( this, action );

			if ( action === 'submit' ) {
				process.next( this.postListing() );
			}
			if ( action === 'submit' || action === 'hide' ) {
				if ( this.shadow ) {
					process.next( this.hideContent() );
				}
				process.next( () => {
					mw.notify(
						!this.shadow ?
							mw.msg( 'deputy.ia.report.success.report' ) :
							( action === 'hide' ?
								mw.msg( 'deputy.ia.report.success.hide' ) :
								mw.msg( 'deputy.ia.report.success' ) ),
						{ type: 'success' }
					);
				} );
				switch ( window.InfringementAssistant.config.ia[ 'on' + (
					action === 'hide' ? 'Hide' : 'Submit'
				) as 'onHide' | 'onSubmit' ].get() ) {
					case TripleCompletionAction.Reload:
						process.next( () => {
							unblockExit( 'ia-spwd' );
							window.location.reload();
						} );
						break;
					case TripleCompletionAction.Redirect:
						process.next( () => {
							unblockExit( 'ia-spwd' );
							window.location.href = mw.util.getUrl(
								CopyrightProblemsPage.getCurrent().title.getPrefixedText()
							);
						} );
						break;
				}
			}
			process.next( function () {
				unblockExit( 'ia-spwd' );
				this.close( { action: action } );
			}, this );

			return process;
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
