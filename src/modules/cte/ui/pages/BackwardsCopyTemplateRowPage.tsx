import { h } from 'tsx-dom';
import '../../../../types';
import BackwardsCopyTemplateRow, {
	BackwardsCopyTemplateRowParameter
} from '../../models/templates/BackwardsCopyTemplateRow';
import unwrapWidget from '../../../../util/unwrapWidget';
import CopiedTemplateEditorDialog from '../CopiedTemplateEditorDialog';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';

export interface BackwardsCopyTemplateRowPageData {
	/**
	 * The row that this page refers to.
	 */
	backwardsCopyTemplateRow: BackwardsCopyTemplateRow;
	/**
	 * The parent of this page.
	 */
	parent: ReturnType<typeof CopiedTemplateEditorDialog>;
}

let InternalBackwardsCopyTemplateRowPage: any;

/**
 * The UI representation of a {{copied}} template row. This refers to a set of `diff`, `to`,
 * or `from` parameters on each {{copied}} template.
 *
 * Note that "Page" in the class title does not refer to a MediaWiki page, but rather
 * a OOUI PageLayout.
 */
function initBackwardsCopyTemplateRowPage() {
	InternalBackwardsCopyTemplateRowPage = class BackwardsCopyTemplateRowPage
		extends OO.ui.PageLayout implements AttributionNoticePageLayout {

		/**
		 * The row that this page refers to.
		 */
		backwardsCopyTemplateRow: BackwardsCopyTemplateRow;
		/**
		 * The parent of this page.
		 *
		 * Set to `any` due to OOUI's lack of proper TypeScript support.
		 */
		parent: ReturnType<typeof CopiedTemplateEditorDialog>;

		// ELEMENTS
		/**
		 * An OOUI FieldsetLayout that contains the button set (using `.append`) and
		 * input fields (using `.addItems`)
		 */
		layout: any;
		/**
		 * An array of OOUI InputWidget widgets that represent the fields of this row.
		 */
		inputs: Record<BackwardsCopyTemplateRowParameter | 'toggle', any>;
		/**
		 * An array of OOUI FieldLayout widgets that contain inputs for this row.
		 */
		fieldLayouts: Record<BackwardsCopyTemplateRowParameter | 'toggle', any>;
		/**
		 * The label of this page. Used in the BookletLayout and header.
		 */
		label: string;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: BackwardsCopyTemplateRowPageData ) {
			const { backwardsCopyTemplateRow, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (BackwardsCopyTemplateEditorDialog) is required' );
			} else if ( backwardsCopyTemplateRow == null ) {
				throw new Error( 'Reference row (BackwardsCopyTemplateRow) is required' );
			}

			const finalConfig = {
				classes: [ 'cte-page-row' ]
			};
			super( backwardsCopyTemplateRow.id, finalConfig );

			this.parent = parent;
			this.backwardsCopyTemplateRow = backwardsCopyTemplateRow;
			this.refreshLabel();

			this.backwardsCopyTemplateRow.parent.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );
			this.backwardsCopyTemplateRow.parent.addEventListener( 'rowDelete', () => {
				parent.rebuildPages();
			} );

			this.$element.append( this.render().$element );
		}

		/**
		 * Refreshes the page's label
		 */
		refreshLabel(): void {
			this.label = mw.message(
				'deputy.cte.backwardsCopy.entry.short',
				this.backwardsCopyTemplateRow.title
			).text();
			if ( this.outlineItem ) {
				this.outlineItem.setLabel( this.label );
			}
		}

		/**
		 * Renders this page. Returns a FieldsetLayout OOUI widget.
		 *
		 * @return An OOUI FieldsetLayout
		 */
		render(): any {
			this.layout = new OO.ui.FieldsetLayout( {
				icon: 'parameter',
				label: mw.message( 'deputy.cte.copied.entry.label' ).text(),
				classes: [ 'cte-fieldset' ]
			} );

			this.layout.$element.append( this.renderButtons() );
			this.layout.addItems( this.renderFields() );

			return this.layout;
		}

		/**
		 * Renders a set of buttons used to modify a specific {{copied}} template row.
		 *
		 * @return An array of OOUI FieldLayouts
		 */
		renderButtons(): JSX.Element {
			const deleteButton = new OO.ui.ButtonWidget( {
				icon: 'trash',
				title: mw.message( 'deputy.cte.copied.entry.remove' ).text(),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				this.backwardsCopyTemplateRow.parent.deleteRow( this.backwardsCopyTemplateRow );
			} );

			return <div style={{
				float: 'right',
				position: 'absolute',
				top: '0.5em',
				right: '0.5em'
			}}>
				{ unwrapWidget( deleteButton )}
			</div>;
		}

		/**
		 * Renders a set of OOUI InputWidgets and FieldLayouts, eventually returning an
		 * array of each FieldLayout to append to the FieldsetLayout.
		 *
		 * @return An array of OOUI FieldLayouts
		 */
		renderFields(): any[] {
			// TODO: Unimplemented function.
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
 * Creates a new BackwardsCopyTemplateRowPage.
 *
 * @param config Configuration to be passed to the element.
 * @return A BackwardsCopyTemplateRowPage object
 */
export default function ( config: BackwardsCopyTemplateRowPageData ): AttributionNoticePageLayout {
	if ( !InternalBackwardsCopyTemplateRowPage ) {
		initBackwardsCopyTemplateRowPage();
	}
	return new InternalBackwardsCopyTemplateRowPage( config );
}
