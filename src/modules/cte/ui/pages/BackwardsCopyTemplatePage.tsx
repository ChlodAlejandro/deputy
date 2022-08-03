import { h } from 'tsx-dom';
import '../../../../types';
import type BackwardsCopyTemplate from '../../models/templates/BackwardsCopyTemplate';
import BackwardsCopyTemplateRowPage from './BackwardsCopyTemplateRowPage';
import unwrapWidget from '../../../../util/unwrapWidget';
import BackwardsCopyTemplateRow from '../../models/templates/BackwardsCopyTemplateRow';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import CopiedTemplateEditorDialog from '../CopiedTemplateEditorDialog';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import { renderMergePanel, renderPreviewPanel } from '../RowPageShared';
import yesNo from '../../../../util/yesNo';

export interface BackwardsCopyTemplatePageData {
	/**
	 * The template that this page refers to.
	 */
	backwardsCopyTemplate: BackwardsCopyTemplate;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to OOUI's lack of proper TypeScript support.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalBackwardsCopyTemplatePage: any;

/**
 * UI representation of a {{backwards copy}} template. This representation is further broken
 * down with `BackwardsCopyTemplateRowPage`, which represents each row on the template.
 *
 * Note that "Page" in the class title does not refer to a MediaWiki page, but rather
 * a OOUI PageLayout.
 */
function initBackwardsCopyTemplatePage() {
	InternalBackwardsCopyTemplatePage = class BackwardsCopyTemplatePage
		extends OO.ui.PageLayout implements AttributionNoticePageLayout {

		/**
		 * The ParsoidDocument that this {{copied}} template is from.
		 */
		document: CTEParsoidDocument;
		/**
		 * The template that this page refers to.
		 */
		backwardsCopyTemplate: BackwardsCopyTemplate;
		/**
		 * The parent of this page.
		 */
		parent: ReturnType<typeof CopiedTemplateEditorDialog>;

		// ELEMENTS
		/**
		 * The "merge" toggle button in the button set.
		 */
		mergeButton: any;
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
		 * All child pages of this BackwardsCopyTemplatePage. Garbage collected when rechecked.
		 */
		childPages: Map<
			BackwardsCopyTemplateRow,
			ReturnType<typeof BackwardsCopyTemplateRowPage>
			> = new Map();

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: BackwardsCopyTemplatePageData ) {
			const { backwardsCopyTemplate, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (BackwardsCopyTemplateEditorDialog) is required' );
			} else if ( backwardsCopyTemplate == null ) {
				throw new Error( 'Reference template (BackwardsCopyTemplate) is required' );
			}

			const label = mw.message(
				'deputy.cte.copied.label',
				config.backwardsCopyTemplate.name
			).text();
			const finalConfig = {
				label: label,
				classes: [ 'cte-page-template' ]
			};
			super(
				`${
					backwardsCopyTemplate.element.getAttribute( 'about' )
				}-${
					backwardsCopyTemplate.i
				}`,
				finalConfig
			);

			this.document = config.backwardsCopyTemplate.parsoid;
			this.backwardsCopyTemplate = config.backwardsCopyTemplate;
			this.parent = config.parent;
			this.label = label;

			backwardsCopyTemplate.addEventListener( 'rowAdd', () => {
				parent.rebuildPages();
			} );
			backwardsCopyTemplate.addEventListener( 'rowDelete', () => {
				parent.rebuildPages();
			} );
			backwardsCopyTemplate.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );

			this.$element.append(
				this.renderButtons(),
				this.renderHeader(),
				renderMergePanel(
					'backwardsCopy',
					this.backwardsCopyTemplate,
					this.mergeButton
				),
				renderPreviewPanel( this.backwardsCopyTemplate ),
				this.renderTemplateOptions()
			);
		}

		/**
		 * @inheritDoc
		 */
		getChildren(): AttributionNoticePageLayout[] {
			const rows = this.backwardsCopyTemplate.rows;
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
				title: mw.message( 'deputy.cte.merge' ).text(),
				framed: false
			} );
			const deleteButton = new OO.ui.ButtonWidget( {
				icon: 'trash',
				title: mw.message( 'deputy.cte.copied.remove' ).text(),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				if ( this.backwardsCopyTemplate.rows.length > 0 ) {
					OO.ui.confirm(
						mw.message(
							'deputy.cte.copied.remove.confirm',
							`${this.backwardsCopyTemplate.rows.length}`
						).text()
					).done( ( confirmed: boolean ) => {
						if ( confirmed ) {
							this.backwardsCopyTemplate.destroy();
						}
					} );
				} else {
					this.backwardsCopyTemplate.destroy();
				}
			} );
			const addButton = new OO.ui.ButtonWidget( {
				flags: [ 'progressive' ],
				icon: 'add',
				label: mw.message( 'deputy.cte.copied.add' ).text()
			} );
			addButton.on( 'click', () => {
				this.backwardsCopyTemplate.addRow(
					new BackwardsCopyTemplateRow( {}, this.backwardsCopyTemplate )
				);
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
				'backwardsCopy', this.backwardsCopyTemplate, this.mergeButton
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
				demo: new OO.ui.CheckboxInputWidget( {
					selected: yesNo( this.backwardsCopyTemplate.demo?.trim() )
				} ),
				comments: new OO.ui.TextINputWidget( {
					value: this.backwardsCopyTemplate.comments?.trim()
				} )
			};
			this.fields = {
				demo: new OO.ui.FieldLayout( this.inputSet.collapse, {
					label: mw.message( 'deputy.cte.copied.collapse' ).text(),
					align: 'inline'
				} ),
				comments: new OO.ui.FieldLayout( this.inputSet.small, {
					label: mw.message( 'deputy.cte.copied.small' ).text(),
					align: 'inline'
				} )
			};
			this.inputSet.demo.on( 'change', ( value: boolean ) => {
				this.backwardsCopyTemplate.demo = value ? 'yes' : null;
				this.backwardsCopyTemplate.save();
			} );
			this.inputSet.comments.on( 'change', ( value: string ) => {
				this.backwardsCopyTemplate.comments = value.trim();
				this.backwardsCopyTemplate.save();
			} );

			return <div class="cte-templateOptions">
				<div>{ unwrapWidget( this.fields.demo ) }</div>
				<div>{ unwrapWidget( this.fields.comments ) }</div>
			</div>;
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
 * Creates a new BackwardsCopyTemplatePage.
 *
 * @param config Configuration to be passed to the element.
 * @return A BackwardsCopyTemplatePage object
 */
export default function ( config: BackwardsCopyTemplatePageData ): AttributionNoticePageLayout {
	if ( !InternalBackwardsCopyTemplatePage ) {
		initBackwardsCopyTemplatePage();
	}
	return new InternalBackwardsCopyTemplatePage( config );
}
