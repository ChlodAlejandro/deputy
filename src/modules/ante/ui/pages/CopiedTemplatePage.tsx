import { h } from 'tsx-dom';
import '../../../../types';
import type CopiedTemplate from '../../models/templates/CopiedTemplate';
import CopiedTemplateRowPage from './CopiedTemplateRowPage';
import unwrapWidget from '../../../../util/unwrapWidget';
import CopiedTemplateRow from '../../models/templates/CopiedTemplateRow';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import CopiedTemplateEditorDialog from '../CopiedTemplateEditorDialog';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import { renderMergePanel, renderPreviewPanel } from '../RowPageShared';
import yesNo from '../../../../util/yesNo';
import dangerModeConfirm from '../../../../util/dangerModeConfirm';

export interface CopiedTemplatePageData {
	/**
	 * The template that this page refers to.
	 */
	copiedTemplate: CopiedTemplate;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to lack of proper handling for mw.loader.using calls and the like.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalCopiedTemplatePage: any;

/**
 * UI representation of a {{copied}} template. This representation is further broken
 * down with `CopiedTemplateRowPage`, which represents each row on the template.
 *
 * Note that "Page" in the class title does not refer to a MediaWiki page, but rather
 * a OOUI PageLayout.
 */
function initCopiedTemplatePage() {
	InternalCopiedTemplatePage = class CopiedTemplatePage
		extends OO.ui.PageLayout implements AttributionNoticePageLayout {

		outlineItem: OO.ui.OutlineOptionWidget;

		/**
		 * The ParsoidDocument that this {{copied}} template is from.
		 */
		document: CTEParsoidDocument;
		/**
		 * The template that this page refers to.
		 */
		copiedTemplate: CopiedTemplate;
		/**
		 * The parent of this page.
		 */
		parent: ReturnType<typeof CopiedTemplateEditorDialog>;

		// ELEMENTS
		/**
		 * The "merge" toggle button in the button set.
		 */
		mergeButton: OO.ui.ButtonWidget;
		/**
		 * A record of OOUI InputWidget objects.
		 */
		inputSet: Record<string, any>;
		/**
		 * Fields of input widgets in `inputSet`.
		 */
		fields: Record<string, any>;
		/**
		 * The label of this page. Used in the BookletLayout and header.
		 */
		label: string;
		/**
		 * The preview panel. A <div> that encloses MediaWiki parser output: the rendered
		 * preview of the template.
		 */
		previewPanel: HTMLElement;
		/**
		 * All child pages of this CopiedTemplatePage. Garbage collected when rechecked.
		 */
		childPages: Map<CopiedTemplateRow, ReturnType<typeof CopiedTemplateRowPage>> = new Map();

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: CopiedTemplatePageData ) {
			const { copiedTemplate, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( copiedTemplate == null ) {
				throw new Error( 'Reference template (CopiedTemplate) is required' );
			}

			const label = mw.message(
				'deputy.ante.copied.label',
				config.copiedTemplate.name
			).text();
			const finalConfig = {
				label: label,
				classes: [ 'cte-page-template' ]
			};
			super(
				copiedTemplate.id,
				finalConfig
			);

			this.document = config.copiedTemplate.parsoid;
			this.copiedTemplate = config.copiedTemplate;
			this.parent = config.parent;
			this.label = label;

			copiedTemplate.addEventListener( 'rowAdd', () => {
				parent.rebuildPages();
			} );
			copiedTemplate.addEventListener( 'rowDelete', () => {
				parent.rebuildPages();
			} );
			copiedTemplate.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );

			this.$element.append(
				this.renderButtons(),
				this.renderHeader(),
				renderMergePanel(
					'copied',
					this.copiedTemplate,
					this.mergeButton
				),
				renderPreviewPanel( this.copiedTemplate ),
				this.renderTemplateOptions()
			);
		}

		/**
		 * @inheritDoc
		 */
		getChildren(): AttributionNoticePageLayout[] {
			const rows = this.copiedTemplate.rows;
			const rowPages: AttributionNoticePageLayout[] = [];

			for ( const row of rows ) {
				if ( !this.childPages.has( row ) ) {
					this.childPages.set( row, row.generatePage( this.parent ) );
				}
				rowPages.push( this.childPages.get( row ) );
			}

			// Delete deleted rows from cache.
			this.childPages.forEach( ( page, row ) => {
				if ( rowPages.indexOf( page ) === -1 ) {
					this.childPages.delete( row );
				}
			} );

			return rowPages;
		}

		/**
		 * @return The rendered header of this PageLayout.
		 */
		renderHeader(): JSX.Element {
			return <h3>{ this.label }</h3>;
		}

		/**
		 * Renders the set of buttons that appear at the top of the page.
		 *
		 * @return A <div> element.
		 */
		renderButtons(): JSX.Element {
			const buttonSet = <div style={{ float: 'right' }}/>;

			this.mergeButton = new OO.ui.ButtonWidget( {
				icon: 'tableMergeCells',
				title: mw.msg( 'deputy.ante.merge' ),
				framed: false
			} );
			const deleteButton = new OO.ui.ButtonWidget( {
				icon: 'trash',
				title: mw.msg( 'deputy.ante.copied.remove' ),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				if ( this.copiedTemplate.rows.length > 0 ) {
					dangerModeConfirm(
						window.CopiedTemplateEditor.config,
						mw.message(
							'deputy.ante.copied.remove.confirm',
							`${this.copiedTemplate.rows.length}`
						).text()
					).done( ( confirmed: boolean ) => {
						if ( confirmed ) {
							this.copiedTemplate.destroy();
						}
					} );
				} else {
					this.copiedTemplate.destroy();
				}
			} );
			const addButton = new OO.ui.ButtonWidget( {
				flags: [ 'progressive' ],
				icon: 'add',
				label: mw.msg( 'deputy.ante.copied.add' )
			} );
			addButton.on( 'click', () => {
				this.copiedTemplate.addRow( new CopiedTemplateRow( {
					to: new mw.Title(
						this.document.getPage()
					).getSubjectPage().getPrefixedText()
				}, this.copiedTemplate ) );
			} );

			buttonSet.appendChild( unwrapWidget( this.mergeButton ) );
			buttonSet.appendChild( unwrapWidget( deleteButton ) );
			buttonSet.appendChild( unwrapWidget( addButton ) );

			return buttonSet;
		}

		/**
		 * Renders the panel used to merge multiple {{copied}} templates.
		 *
		 * @return A <div> element
		 */
		renderMergePanel(): JSX.Element {
			return renderMergePanel(
				'copied', this.copiedTemplate, this.mergeButton
			);
		}

		/**
		 * Renders the global options of this template. This includes parameters that are not
		 * counted towards an entry and affect the template as a whole.
		 *
		 * @return A <div> element.
		 */
		renderTemplateOptions(): JSX.Element {
			this.inputSet = {
				collapse: new OO.ui.CheckboxInputWidget( {
					selected: yesNo( this.copiedTemplate.collapsed?.trim(), false )
				} ),
				small: new OO.ui.CheckboxInputWidget( {
					selected: yesNo( this.copiedTemplate.small?.trim(), false )
				} )
			};
			this.fields = {
				collapse: new OO.ui.FieldLayout( this.inputSet.collapse, {
					label: mw.msg( 'deputy.ante.copied.collapse' ),
					align: 'inline'
				} ),
				small: new OO.ui.FieldLayout( this.inputSet.small, {
					label: mw.msg( 'deputy.ante.copied.small' ),
					align: 'inline'
				} )
			};
			this.inputSet.collapse.on( 'change', ( value: boolean ) => {
				this.copiedTemplate.collapsed = value ? 'yes' : null;
				this.copiedTemplate.save();
			} );
			this.inputSet.small.on( 'change', ( value: boolean ) => {
				this.copiedTemplate.small = value ? 'yes' : null;
				this.copiedTemplate.save();
			} );

			return <div class="cte-templateOptions">
				<div>{ unwrapWidget( this.fields.collapse ) }</div>
				<div>{ unwrapWidget( this.fields.small ) }</div>
			</div>;
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
 * Creates a new CopiedTemplatePage.
 *
 * @param config Configuration to be passed to the element.
 * @return A CopiedTemplatePage object
 */
export default function ( config: CopiedTemplatePageData ): AttributionNoticePageLayout {
	if ( !InternalCopiedTemplatePage ) {
		initCopiedTemplatePage();
	}
	return new InternalCopiedTemplatePage( config );
}
