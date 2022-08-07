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
import swapElements from '../../../../util/swapElements';
import DemoTemplateMessage from './messages/DemoTemplateMessage';
import removeElement from '../../../../util/removeElement';

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
				'deputy.cte.backwardsCopy.label',
				config.backwardsCopyTemplate.name
			).text();
			const finalConfig = {
				label: label,
				classes: [ 'cte-page-template' ]
			};
			super(
				backwardsCopyTemplate.id,
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
				this.renderBotPanel(),
				this.renderDemoPanel(),
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
		 * Renders a panel that shows when a bot is used.
		 *
		 * @return An unwrapped OOUI MessageWidget
		 */
		renderBotPanel(): JSX.Element {
			if ( this.backwardsCopyTemplate.node.hasParameter( 'bot' ) ) {
				const bot = this.backwardsCopyTemplate.node.getParameter( 'bot' );
				return unwrapWidget( new OO.ui.MessageWidget( {
					type: 'notice',
					icon: 'robot',
					label: new OO.ui.HtmlSnippet(
						mw.message( 'deputy.cte.backwardsCopy.bot', bot ).parse()
					)
				} ) );
			} else {
				return null;
			}
		}

		/**
		 * Renders a panel that shows when demo mode is enabled.
		 *
		 * @return An unwrapped OOUI MessageWidget
		 */
		renderDemoPanel(): JSX.Element {
			if ( this.backwardsCopyTemplate.node.hasParameter( 'bot' ) ) {
				// Insert element directly into widget (not as text, or else event
				// handlers will be destroyed).
				const messageBox = new OO.ui.MessageWidget( {
					type: 'notice',
					icon: 'alert',
					label: new OO.ui.HtmlSnippet(
						DemoTemplateMessage().innerHTML
					)
				} );

				const clearButton = new OO.ui.ButtonWidget( {
					flags: [ 'progressive', 'primary' ],
					label: mw.message( 'deputy.cte.demo.clear' ).text()
				} );
				clearButton.on( 'click', () => {
					this.backwardsCopyTemplate.node.removeParameter( 'demo' );
					removeElement( unwrapWidget( messageBox ) );
				} );

				swapElements(
					unwrapWidget( messageBox )
						.querySelector( '.cte-message-button' ),
					unwrapWidget( clearButton )
				);

				return unwrapWidget( messageBox );
			} else {
				return null;
			}
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
			const inputSet = {
				comments: new OO.ui.TextInputWidget( {
					placeholder: mw.message(
						'deputy.cte.backwardsCopy.comments.placeholder'
					).text(),
					value: this.backwardsCopyTemplate.comments?.trim()
				} ),
				id: new OO.ui.TextInputWidget( {
					placeholder: mw.message(
						'deputy.cte.backwardsCopy.id.placeholder'
					).text(),
					value: this.backwardsCopyTemplate.revid?.trim()
				} )
			};
			const fields = {
				comments: new OO.ui.FieldLayout( inputSet.comments, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.backwardsCopy.comments.label' ).text(),
					help: mw.message( 'deputy.cte.backwardsCopy.comments.help' ).text(),
					align: 'top'
				} ),
				id: new OO.ui.FieldLayout( inputSet.id, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.backwardsCopy.id.label' ).text(),
					help: mw.message( 'deputy.cte.backwardsCopy.id.help' ).text(),
					align: 'top'
				} )
			};
			inputSet.comments.on( 'change', ( value: string ) => {
				this.backwardsCopyTemplate.comments = value.trim();
				this.backwardsCopyTemplate.save();
			} );
			inputSet.id.on( 'change', ( value: string ) => {
				this.backwardsCopyTemplate.revid = value.trim();
				this.backwardsCopyTemplate.save();
			} );

			return <div class="cte-templateOptions">
				<div style={{ marginRight: '8px' }}>{ unwrapWidget( fields.comments ) }</div>
				<div style={{ flex: '0.5' }}>{ unwrapWidget( fields.id ) }</div>
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
