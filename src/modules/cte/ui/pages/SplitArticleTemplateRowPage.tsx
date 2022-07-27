import '../../../../types';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import CopiedTemplateEditorDialog from '../CopiedTemplateEditorDialog';
import SplitArticleTemplateRow from '../../models/templates/SplitArticleTemplateRow';
import { h } from 'tsx-dom';

export interface SplitArticleTemplateRowPageData {
	/**
	 * The template that this page refers to.
	 */
	splitArticleTemplateRow: SplitArticleTemplateRow;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to OOUI's lack of proper TypeScript support.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalSplitArticleTemplateRowPage: any;

/**
 * Initializes the process element.
 */
function initSplitArticleTemplateRowPage() {
	InternalSplitArticleTemplateRowPage = class SplitArticleTemplateRowPage
		extends OO.ui.PageLayout
		implements AttributionNoticePageLayout, SplitArticleTemplateRowPageData {

		splitArticleTemplateRow: SplitArticleTemplateRow;
		parent: ReturnType<typeof CopiedTemplateEditorDialog>;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: SplitArticleTemplateRowPageData ) {
			const { splitArticleTemplateRow, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( splitArticleTemplateRow == null ) {
				throw new Error( 'Reference row (SplitArticleTemplateRow) is required' );
			}

			const finalConfig = {
				label: `${
					splitArticleTemplateRow.to || '???'
				} on ${splitArticleTemplateRow.date || '???'}`,
				classes: [ 'cte-page-row' ]
			};
			super( splitArticleTemplateRow.id, finalConfig );

			this.parent = parent;
			this.splitArticleTemplateRow = splitArticleTemplateRow;
			this.label = finalConfig.label;

			this.splitArticleTemplateRow.parent.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );
			this.splitArticleTemplateRow.parent.addEventListener( 'rowDelete', () => {
				parent.rebuildPages();
			} );

			this.$element.append( this.render().$element );
		}

		/**
		 * Renders this page. Returns a FieldsetLayout OOUI widget.
		 *
		 * @return An OOUI FieldsetLayout
		 */
		render() {
			this.layout = new OO.ui.FieldsetLayout( {
				icon: 'parameter',
				label: mw.message( 'deputy.cte.copied.entry.label' ).text(),
				classes: [ 'cte-fieldset' ]
			} );

			this.layout.$element.append( <div>
				${this.splitArticleTemplateRow.to} || ${this.splitArticleTemplateRow.from_oldid} ||
				${this.splitArticleTemplateRow.date} || ${this.splitArticleTemplateRow.diff}
			</div> );

			return this.layout;
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
					.setIcon( 'parameter' )
					.setLevel( 1 )
					.setLabel( this.label );
			}
		}

	};
}

/**
 * Creates a new SplitArticleTemplateRowPage.
 *
 * @param config Configuration to be passed to the element.
 * @return A SplitArticleTemplateRowPage object
 */
export default function ( config: SplitArticleTemplateRowPageData ): AttributionNoticePageLayout {
	if ( !InternalSplitArticleTemplateRowPage ) {
		initSplitArticleTemplateRowPage();
	}
	return new InternalSplitArticleTemplateRowPage( config );
}
