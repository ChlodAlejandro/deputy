import '../../../../types';
import MergedToTemplate, {
	MergedToTemplateParameter
} from '../../models/templates/MergedToTemplate';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import { h } from 'tsx-dom';
import unwrapWidget from '../../../../util/unwrapWidget';
import { renderPreviewPanel } from '../RowPageShared';
import getObjectValues from '../../../../util/getObjectValues';
import yesNo from '../../../../util/yesNo';

export interface MergedToTemplatePageData {
	/**
	 * The template that this page refers to.
	 */
	mergedToTemplate: MergedToTemplate;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to OOUI's lack of proper TypeScript support.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalMergedToTemplatePage: any;

/**
 * Initializes the process element.
 */
function initMergedToTemplatePage() {
	InternalMergedToTemplatePage = class MergedToTemplatePage
		extends OO.ui.PageLayout
		implements AttributionNoticePageLayout, MergedToTemplatePageData {

		/**
		 * @inheritDoc
		 */
		mergedToTemplate: MergedToTemplate;
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
		constructor( config: MergedToTemplatePageData ) {
			const { mergedToTemplate, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( mergedToTemplate == null ) {
				throw new Error( 'Reference template (MergedToTemplate) is required' );
			}

			const finalConfig = {
				classes: [ 'cte-page-template' ]
			};
			super( mergedToTemplate.id, finalConfig );

			this.document = mergedToTemplate.parsoid;
			this.mergedToTemplate = mergedToTemplate;
			this.parent = config.parent;
			this.refreshLabel();

			mergedToTemplate.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );

			this.$element.append(
				this.renderButtons(),
				this.renderHeader(),
				renderPreviewPanel(
					this.mergedToTemplate
				),
				this.renderTemplateOptions()
			);
		}

		/**
		 * Refreshes the page's label
		 */
		refreshLabel(): void {
			this.label = mw.message(
				'deputy.cte.mergedTo.label',
				this.mergedToTemplate.to || '???'
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
				title: mw.message( 'deputy.cte.mergedTo.remove' ).text(),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				this.mergedToTemplate.destroy();
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
				label: mw.message( 'deputy.cte.templateOptions' ).text(),
				classes: [ 'cte-fieldset' ]
			} );

			const rowDate = this.mergedToTemplate.date;
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
				to: new mw.widgets.TitleInputWidget( {
					$overlay: this.parent.$overlay,
					required: true,
					value: this.mergedToTemplate.to || '',
					placeholder: mw.message( 'deputy.cte.mergedTo.to.placeholder' ).text()
				} ),
				date: new mw.widgets.datetime.DateTimeInputWidget( {
					$overlay: this.parent.$overlay,
					required: true,
					calendar: null,
					icon: 'calendar',
					clearable: true,
					value: parsedDate
				} ),
				small: new OO.ui.CheckboxInputWidget( {
					$overlay: this.parent.$overlay,
					selected: yesNo( this.mergedToTemplate.small, false )
				} )
			};
			const fieldLayouts = {
				to: new OO.ui.FieldLayout( inputs.to, {
					$overlay: this.parent.$overlay,
					align: 'top',
					label: mw.message( 'deputy.cte.mergedTo.to.label' ).text(),
					help: mw.message( 'deputy.cte.mergedTo.to.help' ).text()
				} ),
				date: new OO.ui.FieldLayout( inputs.date, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.message( 'deputy.cte.mergedTo.date.label' ).text(),
					help: mw.message( 'deputy.cte.mergedTo.date.help' ).text()
				} ),
				small: new OO.ui.FieldLayout( inputs.small, {
					$overlay: this.parent.$overlay,
					align: 'inline',
					label: mw.message( 'deputy.cte.mergedTo.small.label' ).text(),
					help: mw.message( 'deputy.cte.mergedTo.small.help' ).text()
				} )
			};

			for ( const _field in inputs ) {
				const field = _field as MergedToTemplateParameter;
				const input = inputs[ field ];

				// Attach the change listener
				input.on( 'change', ( value: string ) => {
					if ( input instanceof OO.ui.CheckboxInputWidget ) {
						this.mergedToTemplate[ field ] = value ? 'yes' : 'no';
					} else if ( input instanceof mw.widgets.datetime.DateTimeInputWidget ) {
						this.mergedToTemplate[ field ] =
							new Date( value ).toLocaleDateString( 'en-GB', {
								year: 'numeric', month: 'long', day: 'numeric'
							} );
						if ( value.length > 0 ) {
							fieldLayouts[ field ].setWarnings( [] );
						}
					} else {
						this.mergedToTemplate[ field ] = value;
					}

					this.mergedToTemplate.save();
				} );

				if ( input instanceof OO.ui.TextInputWidget ) {
					// Rechecks the validity of the field.
					input.setValidityFlag();
				}
			}

			inputs.to.on( 'change', () => {
				this.refreshLabel();
			} );

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
 * Creates a new MergedToTemplatePage.
 *
 * @param config Configuration to be passed to the element.
 * @return A MergedToTemplatePage object
 */
export default function ( config: MergedToTemplatePageData ) {
	if ( !InternalMergedToTemplatePage ) {
		initMergedToTemplatePage();
	}
	return new InternalMergedToTemplatePage( config );
}
