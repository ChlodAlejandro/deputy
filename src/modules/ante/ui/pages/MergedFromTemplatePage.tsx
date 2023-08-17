import '../../../../types';
import MergedFromTemplate, {
	MergedFromTemplateParameter
} from '../../models/templates/MergedFromTemplate';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import { h } from 'tsx-dom';
import unwrapWidget from '../../../../util/unwrapWidget';
import { renderPreviewPanel } from '../RowPageShared';
import getObjectValues from '../../../../util/getObjectValues';
import nsId from '../../../../wiki/util/nsId';
import yesNo from '../../../../util/yesNo';

export interface MergedFromTemplatePageData {
	/**
	 * The template that this page refers to.
	 */
	mergedFromTemplate: MergedFromTemplate;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to lack of proper handling for mw.loader.using calls and the like.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalMergedFromTemplatePage: any;

/**
 * Initializes the process element.
 */
function initMergedFromTemplatePage() {
	InternalMergedFromTemplatePage = class MergedFromTemplatePage
		extends OO.ui.PageLayout
		implements AttributionNoticePageLayout, MergedFromTemplatePageData {

		outlineItem: OO.ui.OutlineOptionWidget;

		/**
		 * @inheritDoc
		 */
		mergedFromTemplate: MergedFromTemplate;
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
		constructor( config: MergedFromTemplatePageData ) {
			const { mergedFromTemplate, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( mergedFromTemplate == null ) {
				throw new Error( 'Reference template (MergedFromTemplate) is required' );
			}

			const finalConfig = {
				classes: [ 'cte-page-template' ]
			};
			super( mergedFromTemplate.id, finalConfig );

			this.document = mergedFromTemplate.parsoid;
			this.mergedFromTemplate = mergedFromTemplate;
			this.parent = config.parent;
			this.refreshLabel();

			mergedFromTemplate.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );

			this.$element.append(
				this.renderButtons(),
				this.renderHeader(),
				renderPreviewPanel(
					this.mergedFromTemplate
				),
				this.renderTemplateOptions()
			);
		}

		/**
		 * Refreshes the page's label
		 */
		refreshLabel(): void {
			this.label = mw.message(
				'deputy.ante.mergedFrom.label',
				this.mergedFromTemplate.article || '???'
			).text();
			if ( this.outlineItem ) {
				this.outlineItem.setLabel( this.label );
			}
		}

		/**
		 * Renders the set of buttons that appear at the top of the page.
		 *
		 * @return A <div> element.
		 */
		renderButtons(): JSX.Element {
			const buttonSet = <div style={{ float: 'right' }}/>;

			const deleteButton = new OO.ui.ButtonWidget( {
				icon: 'trash',
				title: mw.msg( 'deputy.ante.mergedFrom.remove' ),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				this.mergedFromTemplate.destroy();
			} );

			buttonSet.appendChild( unwrapWidget( deleteButton ) );

			return buttonSet;
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
				label: mw.msg( 'deputy.ante.templateOptions' ),
				classes: [ 'cte-fieldset' ]
			} );

			const rowDate = this.mergedFromTemplate.date;
			const parsedDate =
				( rowDate == null || rowDate.trim().length === 0 ) ?
					undefined : (
						!isNaN( new Date( rowDate.trim() + ' UTC' ).getTime() ) ?
							( new Date( rowDate.trim() + ' UTC' ) ) : (
								!isNaN( new Date( rowDate.trim() ).getTime() ) ?
									new Date( rowDate.trim() ) : null
							)
					);

			const inputs = {
				article: new mw.widgets.TitleInputWidget( {
					$overlay: this.parent.$overlay,
					required: true,
					value: this.mergedFromTemplate.article || '',
					placeholder: mw.msg( 'deputy.ante.mergedFrom.article.placeholder' )
				} ),
				date: new mw.widgets.DateInputWidget( {
					$overlay: this.parent.$overlay,
					required: true,
					icon: 'calendar',
					value: parsedDate ? `${
						parsedDate.getUTCFullYear()
					}-${
						parsedDate.getUTCMonth() + 1
					}-${
						parsedDate.getUTCDate()
					}` : undefined,
					placeholder: mw.msg( 'deputy.ante.copied.date.placeholder' )
				} ),
				target: new mw.widgets.TitleInputWidget( {
					$overlay: this.parent.$overlay,
					value: this.mergedFromTemplate.target || '',
					placeholder: mw.msg( 'deputy.ante.mergedFrom.target.placeholder' )
				} ),
				afd: new mw.widgets.TitleInputWidget( {
					$overlay: this.parent.$overlay,
					value: this.mergedFromTemplate.afd || '',
					placeholder: mw.msg( 'deputy.ante.mergedFrom.afd.placeholder' ),
					validate: ( title: string ) => {
						// TODO: ANTE l10n
						return title.trim().length === 0 || title.startsWith(
							new mw.Title( 'Articles for deletion/', nsId( 'wikipedia' ) )
								.toText()
						);
					}
				} ),
				talk: new OO.ui.CheckboxInputWidget( {
					selected: yesNo( this.mergedFromTemplate.target )
				} )
			};
			const fieldLayouts = {
				article: new OO.ui.FieldLayout( inputs.article, {
					$overlay: this.parent.$overlay,
					align: 'top',
					label: mw.msg( 'deputy.ante.mergedFrom.article.label' ),
					help: mw.msg( 'deputy.ante.mergedFrom.article.help' )
				} ),
				date: new OO.ui.FieldLayout( inputs.date, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.msg( 'deputy.ante.mergedFrom.date.label' ),
					help: mw.msg( 'deputy.ante.mergedFrom.date.help' )
				} ),
				target: new OO.ui.FieldLayout( inputs.target, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.msg( 'deputy.ante.mergedFrom.target.label' ),
					help: mw.msg( 'deputy.ante.mergedFrom.target.help' )
				} ),
				afd: new OO.ui.FieldLayout( inputs.afd, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.msg( 'deputy.ante.mergedFrom.afd.label' ),
					help: mw.msg( 'deputy.ante.mergedFrom.afd.help' )
				} ),
				talk: new OO.ui.FieldLayout( inputs.talk, {
					$overlay: this.parent.$overlay,
					align: 'inline',
					label: mw.msg( 'deputy.ante.mergedFrom.talk.label' ),
					help: mw.msg( 'deputy.ante.mergedFrom.talk.help' )
				} )
			};

			for ( const _field in inputs ) {
				const field = _field as MergedFromTemplateParameter;
				const input = inputs[ field ];

				// Attach the change listener
				input.on( 'change', ( value: string ) => {
					if ( input instanceof OO.ui.CheckboxInputWidget ) {
						this.mergedFromTemplate[ field ] = value ? 'yes' : 'no';
					} else if ( input instanceof mw.widgets.DateInputWidget ) {
						this.mergedFromTemplate[ field ] = value ?
							new Date( value + ' UTC' ).toLocaleDateString( 'en-GB', {
								year: 'numeric', month: 'long', day: 'numeric'
							} ) : undefined;
						if ( value.length > 0 ) {
							fieldLayouts[ field ].setWarnings( [] );
						}
					} else {
						this.mergedFromTemplate[ field ] = value;
					}

					this.mergedFromTemplate.save();
				} );

				if ( input instanceof OO.ui.TextInputWidget ) {
					// Rechecks the validity of the field.
					input.setValidityFlag();
				}
			}

			inputs.article.on( 'change', () => {
				this.refreshLabel();
			} );

			layout.addItems( getObjectValues( fieldLayouts ) );

			return unwrapWidget( layout );
		}

		/**
		 * Sets up the outline item of this page. Used in the BookletLayout.
		 */
		setupOutlineItem() {
			if ( this.outlineItem !== undefined ) {
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
 * Creates a new MergedFromTemplatePage.
 *
 * @param config Configuration to be passed to the element.
 * @return A MergedFromTemplatePage object
 */
export default function ( config: MergedFromTemplatePageData ) {
	if ( !InternalMergedFromTemplatePage ) {
		initMergedFromTemplatePage();
	}
	return new InternalMergedFromTemplatePage( config );
}
