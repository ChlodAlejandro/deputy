import '../../../../types';
import SplitArticleTemplateRow from '../../models/templates/SplitArticleTemplateRow';
import SplitArticleTemplate from '../../models/templates/SplitArticleTemplate';
import SplitArticleTemplateRowPage from './splitArticleTemplateRowPage';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import { h } from 'tsx-dom';

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
				`${
					splitArticleTemplate.element.getAttribute( 'about' )
				}-${
					splitArticleTemplate.i
				}`,
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
				this.renderHeader()
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
					this.pageCache.delete( row );
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
