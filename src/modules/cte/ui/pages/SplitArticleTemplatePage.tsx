import '../../../../types';
import SplitArticleTemplateRow from '../../models/templates/SplitArticleTemplateRow';
import SplitArticleTemplate from '../../models/templates/SplitArticleTemplate';
import SplitArticleTemplateRowPage from './SplitArticleTemplateRowPage';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import { h } from 'tsx-dom';
import unwrapWidget from '../../../../util/unwrapWidget';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import { renderMergePanel, renderPreviewPanel } from '../RowPageShared';
import yesNo from '../../../../util/yesNo';

export interface SplitArticleTemplatePageData {
	/**
	 * The template that this page refers to.
	 */
	splitArticleTemplate: SplitArticleTemplate;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to OOUI's lack of proper TypeScript support.
	 */
	parent: /* splitArticleTemplateEditorDialog */ any;
}

let InternalSplitArticleTemplatePage: any;

/**
 * Initializes the process element.
 */
function initSplitArticleTemplatePage() {
	InternalSplitArticleTemplatePage = class SplitArticleTemplatePage
		extends OO.ui.PageLayout
		implements AttributionNoticePageLayout, SplitArticleTemplatePageData {

		/**
		 * @inheritDoc
		 */
		splitArticleTemplate: SplitArticleTemplate;
		/**
		 * @inheritDoc
		 */
		parent: /* splitArticleTemplateEditorDialog */ any;
		/**
		 * The CTEParsoidDocument that this page refers to.
		 */
		document: CTEParsoidDocument;

		/**
		 * Label for this page.
		 */
		label: string;

		/**
		 * All child pages of this splitArticleTemplatePage. Garbage collected when rechecked.
		 */
		childPages: Map<SplitArticleTemplateRow, ReturnType<typeof SplitArticleTemplateRowPage>> =
			new Map();

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: SplitArticleTemplatePageData ) {
			const { splitArticleTemplate, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( splitArticleTemplate == null ) {
				throw new Error( 'Reference template (SplitArticleTemplate) is required' );
			}

			const label = mw.message(
				'deputy.cte.splitArticle.label',
				config.splitArticleTemplate.name
			).text();
			const finalConfig = {
				label: label,
				classes: [ 'cte-page-template' ]
			};
			super(
				splitArticleTemplate.id,
				finalConfig
			);

			this.document = config.splitArticleTemplate.parsoid;
			this.splitArticleTemplate = config.splitArticleTemplate;
			this.parent = config.parent;
			this.label = label;

			splitArticleTemplate.addEventListener( 'rowAdd', () => {
				parent.rebuildPages();
			} );
			splitArticleTemplate.addEventListener( 'rowDelete', () => {
				parent.rebuildPages();
			} );
			splitArticleTemplate.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );

			this.$element.append(
				this.renderButtons(),
				this.renderHeader(),
				renderMergePanel(
					'splitArticle',
					this.splitArticleTemplate,
					this.mergeButton
				),
				renderPreviewPanel( this.splitArticleTemplate ),
				this.renderTemplateOptions()
			);
		}

		/**
		 * @inheritDoc
		 */
		getChildren(): AttributionNoticePageLayout[] {
			const rows = this.splitArticleTemplate.rows;
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
				title: mw.message( 'deputy.cte.splitArticle.remove' ).text(),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				if ( this.splitArticleTemplate.rows.length > 0 ) {
					OO.ui.confirm(
						mw.message(
							'deputy.cte.splitArticle.remove.confirm',
							`${this.splitArticleTemplate.rows.length}`
						).text()
					).done( ( confirmed: boolean ) => {
						if ( confirmed ) {
							this.splitArticleTemplate.destroy();
						}
					} );
				} else {
					this.splitArticleTemplate.destroy();
				}
			} );
			const addButton = new OO.ui.ButtonWidget( {
				flags: [ 'progressive' ],
				icon: 'add',
				label: mw.message( 'deputy.cte.splitArticle.add' ).text()
			} );
			addButton.on( 'click', () => {
				this.splitArticleTemplate.addRow( new SplitArticleTemplateRow(
					{}, this.splitArticleTemplate
				) );
			} );

			this.splitArticleTemplate.addEventListener( 'rowAdd', () => {
				// TODO: Remove after template improvements.
				addButton.setDisabled( this.splitArticleTemplate.rows.length >= 10 );
			} );

			buttonSet.appendChild( unwrapWidget( this.mergeButton ) );
			buttonSet.appendChild( unwrapWidget( deleteButton ) );
			buttonSet.appendChild( unwrapWidget( addButton ) );

			return buttonSet;
		}

		/**
		 * @return The rendered header of this PageLayout.
		 */
		renderHeader(): JSX.Element {
			return <h3>{ this.label }</h3>;
		}

		/**
		 * Renders the global options of this template. This includes parameters that are not
		 * counted towards an entry and affect the template as a whole.
		 *
		 * @return A <div> element.
		 */
		renderTemplateOptions(): JSX.Element {
			const page = new mw.Title(
				this.splitArticleTemplate.parsoid.getPage()
			).getSubjectPage().getPrefixedText();

			const collapse = new OO.ui.CheckboxInputWidget( {
				selected: this.splitArticleTemplate.collapse ?
					yesNo( this.splitArticleTemplate.collapse ) : false
			} );
			const from = new mw.widgets.TitleInputWidget( {
				$overlay: this.parent.$overlay,
				value: this.splitArticleTemplate.from || '',
				placeholder: page
			} );

			collapse.on( 'change', ( value: boolean ) => {
				this.splitArticleTemplate.collapse = value ? 'yes' : null;
				this.splitArticleTemplate.save();
			} );
			from.on( 'change', ( value: string ) => {
				this.splitArticleTemplate.from = value.length > 0 ? value : page;
				this.splitArticleTemplate.save();
			} );

			return <div class="cte-templateOptions">
				<div>{ unwrapWidget( new OO.ui.FieldLayout( from, {
					$overlay: this.parent.$overlay,
					align: 'top',
					label: mw.message( 'deputy.cte.splitArticle.from' ).text(),
					help: mw.message( 'deputy.cte.splitArticle.from.help' ).text()
				} ) ) }</div>
				<div style={{
					flex: '0',
					alignSelf: 'center',
					marginLeft: '8px'
				}}>{ unwrapWidget( new OO.ui.FieldLayout( collapse, {
						$overlay: this.parent.$overlay,
						align: 'top',
						label: mw.message( 'deputy.cte.splitArticle.collapse' ).text()
					} ) )}</div>
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
 * Creates a new SplitArticleTemplatePage.
 *
 * @param config Configuration to be passed to the element.
 * @return A SplitArticleTemplatePage object
 */
export default function ( config: SplitArticleTemplatePageData ) {
	if ( !InternalSplitArticleTemplatePage ) {
		initSplitArticleTemplatePage();
	}
	return new InternalSplitArticleTemplatePage( config );
}
