import '../../../../types';
import TranslatedPageTemplate from '../../models/templates/TranslatedPageTemplate';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import { h } from 'tsx-dom';
import unwrapWidget from '../../../../util/unwrapWidget';
import { renderPreviewPanel } from '../RowPageShared';
import getObjectValues from '../../../../util/getObjectValues';
import yesNo from '../../../../util/yesNo';
import copyToClipboard from '../../../../util/copyToClipboard';

export interface TranslatedPageTemplatePageData {
	/**
	 * The template that this page refers to.
	 */
	translatedPageTemplate: TranslatedPageTemplate;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to OOUI's lack of proper TypeScript support.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalTranslatedPageTemplatePage: any;

/**
 * Initializes the process element.
 */
function initTranslatedPageTemplatePage() {
	InternalTranslatedPageTemplatePage = class TranslatedPageTemplatePage
		extends OO.ui.PageLayout
		implements AttributionNoticePageLayout, TranslatedPageTemplatePageData {

		/**
		 * @inheritDoc
		 */
		translatedPageTemplate: TranslatedPageTemplate;
		/**
		 * @inheritDoc
		 */
		parent: /* CopiedTemplateEditorDialog */ any;
		/**
		 * The CTEParsoidDocument that this page refers to.
		 */
		document: CTEParsoidDocument;

		/**
		 * Label for this page.
		 */
		label: string;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: TranslatedPageTemplatePageData ) {
			const { translatedPageTemplate, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( translatedPageTemplate == null ) {
				throw new Error( 'Reference template (TranslatedPageTemplate) is required' );
			}

			const finalConfig = {
				classes: [ 'cte-page-template' ]
			};
			super( translatedPageTemplate.id, finalConfig );

			this.document = translatedPageTemplate.parsoid;
			this.translatedPageTemplate = translatedPageTemplate;
			this.parent = config.parent;
			this.refreshLabel();

			translatedPageTemplate.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );

			this.$element.append(
				this.renderButtons(),
				this.renderHeader(),
				renderPreviewPanel(
					this.translatedPageTemplate
				),
				this.renderTemplateOptions()
			);
		}

		/**
		 * Refreshes the page's label
		 */
		refreshLabel(): void {
			this.label = mw.message(
				'deputy.ante.translatedPage.label',
				this.translatedPageTemplate.lang || '??',
				this.translatedPageTemplate.page || '???'
			).text();
			if ( this.outlineItem ) {
				this.outlineItem.setLabel( this.label );
			}
		}

		/**
		 * Renders the set of buttons that appear at the left of the page.
		 *
		 * @return A <div> element.
		 */
		renderButtons(): JSX.Element {
			const copyButton = new OO.ui.ButtonWidget( {
				icon: 'quotes',
				title: mw.message( 'deputy.ante.translatedPage.copy' ).text(),
				framed: false
			} );
			copyButton.on( 'click', () => {
				// TODO: Find out a way to l10n-ize this.
				let attributionString = `[[WP:PATT|Attribution]]: Content translated from [[:${
					this.translatedPageTemplate.lang
				}:`;
				let lacking = false;
				if (
					this.translatedPageTemplate.page != null &&
					this.translatedPageTemplate.page.length !== 0
				) {
					attributionString += `${this.translatedPageTemplate.page}]]`;
				} else {
					lacking = true;
					if ( this.translatedPageTemplate.version != null ) {
						attributionString += `|from a page on ${
							this.translatedPageTemplate.lang
						}.wikipedia]]`;
					}
				}
				if ( this.translatedPageTemplate.version != null ) {
					attributionString += ` as of revision [[:ru:Special:Diff/${
						this.translatedPageTemplate.version
					}|${
						this.translatedPageTemplate.version
					}]]`;
				}
				if (
					this.translatedPageTemplate.insertversion != null &&
					this.translatedPageTemplate.insertversion.length !== 0
				) {
					attributionString += ` with [[Special:Diff/${
						this.translatedPageTemplate.insertversion
					}|this edit]]`;
				}
				if (
					this.translatedPageTemplate.page != null &&
					this.translatedPageTemplate.page.length !== 0
				) {
					attributionString += `; refer to that page's [[:${
						this.translatedPageTemplate.lang
					}:Special:PageHistory/${
						this.translatedPageTemplate.page
					}|edit history]] for additional attribution`;
				}
				attributionString += '.';

				copyToClipboard( attributionString );

				if ( lacking ) {
					mw.notify(
						mw.message( 'deputy.ante.translatedPage.copy.lacking' ).text(),
						{ title: mw.message( 'deputy.ante' ).text(), type: 'warn' }
					);
				} else {
					mw.notify(
						mw.message( 'deputy.ante.translatedPage.copy.success' ).text(),
						{ title: mw.message( 'deputy.ante' ).text() }
					);
				}
			} );

			const deleteButton = new OO.ui.ButtonWidget( {
				icon: 'trash',
				title: mw.message( 'deputy.ante.translatedPage.remove' ).text(),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				this.translatedPageTemplate.destroy();
			} );

			return <div style={{ float: 'right' }}>
				{ unwrapWidget( copyButton ) }
				{ unwrapWidget( deleteButton ) }
			</div>;
		}

		/**
		 * @return The rendered header of this PageLayout.
		 */
		renderHeader(): JSX.Element {
			return <h3>{ this.label }</h3>;
		}

		/**
		 * @return The options for this template
		 */
		renderTemplateOptions(): JSX.Element {
			const layout = new OO.ui.FieldsetLayout( {
				icon: 'parameter',
				label: mw.message( 'deputy.ante.templateOptions' ).text(),
				classes: [ 'cte-fieldset' ]
			} );

			const searchApi = new mw.ForeignApi(
				mw.util.wikiScript( 'api' ),
				{
					anonymous: true
				}
			);

			const inputs = {
				lang: new OO.ui.TextInputWidget( {
					required: true,
					value: this.translatedPageTemplate.lang,
					placeholder: mw.message( 'deputy.ante.translatedPage.lang.placeholder' ).text(),
					validate: /^[a-z\d-]+$/gi
				} ),
				page: new mw.widgets.TitleInputWidget( {
					$overlay: this.parent.$overlay,
					api: searchApi,
					required: true,
					value: this.translatedPageTemplate.page || '',
					placeholder: mw.message( 'deputy.ante.translatedPage.page.placeholder' ).text()
				} ),
				comments: new OO.ui.TextInputWidget( {
					value: this.translatedPageTemplate.comments,
					placeholder: mw.message(
						'deputy.ante.translatedPage.comments.placeholder'
					).text()
				} ),
				version: new OO.ui.TextInputWidget( {
					value: this.translatedPageTemplate.version,
					placeholder: mw.message(
						'deputy.ante.translatedPage.version.placeholder'
					).text(),
					validate: /^\d+$/gi
				} ),
				insertversion: new OO.ui.TextInputWidget( {
					value: this.translatedPageTemplate.insertversion,
					placeholder: mw.message(
						'deputy.ante.translatedPage.insertversion.placeholder'
					).text(),
					validate: /^[\d/]+$/gi
				} ),
				section: new OO.ui.TextInputWidget( {
					value: this.translatedPageTemplate.section,
					placeholder: mw.message(
						'deputy.ante.translatedPage.section.placeholder'
					).text()
				} ),
				small: new OO.ui.CheckboxInputWidget( {
					selected: yesNo( this.translatedPageTemplate.small ?? 'yes' )
				} ),
				partial: new OO.ui.CheckboxInputWidget( {
					selected: !!this.translatedPageTemplate.partial
				} )
			};
			const fieldLayouts = {
				lang: new OO.ui.FieldLayout( inputs.lang, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.message( 'deputy.ante.translatedPage.lang.label' ).text(),
					help: mw.message( 'deputy.ante.translatedPage.lang.help' ).text()
				} ),
				page: new OO.ui.FieldLayout( inputs.page, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.message( 'deputy.ante.translatedPage.page.label' ).text(),
					help: mw.message( 'deputy.ante.translatedPage.page.help' ).text()
				} ),
				comments: new OO.ui.FieldLayout( inputs.comments, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.message( 'deputy.ante.translatedPage.comments.label' ).text(),
					help: mw.message( 'deputy.ante.translatedPage.comments.help' ).text()
				} ),
				version: new OO.ui.FieldLayout( inputs.version, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.message( 'deputy.ante.translatedPage.version.label' ).text(),
					help: mw.message( 'deputy.ante.translatedPage.version.help' ).text()
				} ),
				insertversion: new OO.ui.FieldLayout( inputs.insertversion, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.message( 'deputy.ante.translatedPage.insertversion.label' ).text(),
					help: mw.message( 'deputy.ante.translatedPage.insertversion.help' ).text()
				} ),
				section: new OO.ui.FieldLayout( inputs.section, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.message( 'deputy.ante.translatedPage.section.label' ).text(),
					help: mw.message( 'deputy.ante.translatedPage.section.help' ).text()
				} ),
				small: new OO.ui.FieldLayout( inputs.small, {
					$overlay: this.parent.$overlay,
					align: 'inline',
					label: mw.message( 'deputy.ante.translatedPage.small.label' ).text(),
					help: mw.message( 'deputy.ante.translatedPage.small.help' ).text()
				} ),
				partial: new OO.ui.FieldLayout( inputs.partial, {
					$overlay: this.parent.$overlay,
					align: 'inline',
					label: mw.message( 'deputy.ante.translatedPage.partial.label' ).text(),
					help: mw.message( 'deputy.ante.translatedPage.partial.help' ).text()
				} )
			};

			for ( const _field in inputs ) {
				const field = _field as keyof typeof inputs;
				const input = inputs[ field ];

				// Attach the change listener
				input.on( 'change', ( value: string ) => {
					if ( input instanceof OO.ui.CheckboxInputWidget ) {
						this.translatedPageTemplate[ field ] = value ? 'yes' : 'no';
					} else {
						this.translatedPageTemplate[ field ] =
							typeof value === 'string' ? value.trim() : value;
					}

					this.translatedPageTemplate.save();
				} );

				if ( input instanceof OO.ui.TextInputWidget ) {
					// Rechecks the validity of the field.
					input.setValidityFlag();
				}
			}

			inputs.lang.on( 'change', ( value: string ) => {
				this.refreshLabel();
				if ( !/^[a-z\d-]+$/gi.test( value ) ) {
					return;
				}
				( searchApi as any ).apiUrl = ( searchApi as any ).defaults.ajax.url =
					'//' + value + '.wikipedia.org/w/api.php';
			} );
			inputs.page.on( 'change', () => {
				this.refreshLabel();
			} );

			if ( this.translatedPageTemplate.lang ) {
				( searchApi as any ).apiUrl = ( searchApi as any ).defaults.ajax.url =
					'//' + this.translatedPageTemplate.lang + '.wikipedia.org/w/api.php';
			}

			layout.addItems( getObjectValues( fieldLayouts ) );

			return unwrapWidget( layout );
		}

		/**
		 * Sets up the outline item of this page. Used in the BookletLayout.
		 */
		setupOutlineItem() {
			/** @member any */
			if ( this.outlineItem !== undefined ) {
				/** @member any */
				this.outlineItem
					.setMovable( true )
					.setRemovable( true )
					.setIcon( 'puzzle' )
					.setLevel( 0 )
					.setLabel( this.label );
			}
		}

	};
}

/**
 * Creates a new TranslatedPageTemplatePage.
 *
 * @param config Configuration to be passed to the element.
 * @return A TranslatedPageTemplatePage object
 */
export default function ( config: TranslatedPageTemplatePageData ) {
	if ( !InternalTranslatedPageTemplatePage ) {
		initTranslatedPageTemplatePage();
	}
	return new InternalTranslatedPageTemplatePage( config );
}
