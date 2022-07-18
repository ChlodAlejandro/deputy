import '../../../types';
import CopiedTemplateRow from '../models/CopiedTemplateRow';
import RowChangeEvent from '../models/RowChangeEvent';
import unwrapWidget from '../../../util/unwrapWidget';
import { h } from 'tsx-dom';
import copyToClipboard from '../../../util/copyToClipboard';

export interface CopiedTemplateRowPageData {
	/**
	 * The row that this page refers to.
	 */
	copiedTemplateRow: CopiedTemplateRow;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to OOUI's lack of proper TypeScript support.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalCopiedTemplateRowPage: any;

/**
 * The UI representation of a {{copied}} template row. This refers to a set of `diff`, `to`,
 * or `from` parameters on each {{copied}} template.
 *
 * Note that "Page" in the class title does not refer to a MediaWiki page, but rather
 * a OOUI PageLayout.
 */
function initCopiedTemplateRowPage() {
	InternalCopiedTemplateRowPage = class CopiedTemplateRowPage extends OO.ui.PageLayout {

		/**
		 * The row that this page refers to.
		 */
		copiedTemplateRow: CopiedTemplateRow;
		/**
		 * The parent of this page.
		 *
		 * Set to `any` due to OOUI's lack of proper TypeScript support.
		 */
		parent: /* CopiedTemplateEditorDialog */ any;

		// ELEMENTS
		/**
		 * An OOUI FieldsetLayout that contains the button set (using `.append`) and
		 * input fields (using `.addItems`)
		 */
		layout: any;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: CopiedTemplateRowPageData ) {
			const { copiedTemplateRow, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( copiedTemplateRow == null ) {
				throw new Error( 'Reference row (CopiedTemplateRow) is required' );
			}

			const finalConfig = {
				label: `${copiedTemplateRow.from || '???'} to ${copiedTemplateRow.to || '???'}`,
				icon: 'parameter',
				level: 1,
				classes: [ 'cte-page-row' ]
			};
			super( copiedTemplateRow.id, finalConfig );

			this.copiedTemplateRow = config.copiedTemplateRow;

			this.copiedTemplateRow.parent.addEventListener( 'destroy', () => {
				// Check if the page hasn't been deleted yet.
				if ( parent.layout.getPage( this.name ) ) {
					parent.layout.removePages( [ this ] );
				}
			} );
			this.copiedTemplateRow.parent.addEventListener(
				'rowDelete',
				( event: RowChangeEvent ) => {
					if ( event.row.id === this.name ) {
						parent.layout.removePages( [ this ] );
					}
				}
			);

			this.$element.append( this.render().$element );
		}

		/**
		 * Renders this page. Returns a FieldsetLayout OOUI widge.
		 *
		 * @return An OOUI FieldsetLayout
		 */
		render(): any {
			this.layout = new OO.ui.FieldsetLayout( {
				icon: 'parameter',
				label: 'Template row',
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
				this.copiedTemplateRow.parent.deleteRow( this.copiedTemplateRow );
			} );
			const copyButton = new OO.ui.ButtonWidget( {
				icon: 'quotes',
				title: mw.message( 'deputy.cte.copied.entry.copy' ).text(),
				framed: false
			} );
			copyButton.on( 'click', () => {
				// TODO: i18n
				let attributionString = `[[WP:PATT|Attribution]]: Content ${
					this.copiedTemplateRow.merge ? 'merged' : 'partially copied'
				}`;
				let lacking = false;
				if ( this.copiedTemplateRow.from != null && this.copiedTemplateRow.from.length !== 0 ) {
					attributionString += ` from [[${this.copiedTemplateRow.from}]]`;
				} else {
					lacking = true;
					if ( this.copiedTemplateRow.from_oldid != null ) {
						attributionString += ' from a page';
					}
				}
				if ( this.copiedTemplateRow.from_oldid != null ) {
					attributionString += ` as of revision [[Special:Diff/${
						this.copiedTemplateRow.from_oldid
					}|${
						this.copiedTemplateRow.from_oldid
					}]]`;
				}
				if ( this.copiedTemplateRow.to_diff != null || this.copiedTemplateRow.to_oldid != null ) {
					// Shifting will ensure that `to_oldid` will be used if `to_diff` is missing.
					const diffPart1 = this.copiedTemplateRow.to_oldid || this.copiedTemplateRow.to_diff;
					const diffPart2 = this.copiedTemplateRow.to_diff || this.copiedTemplateRow.to_oldid;

					attributionString += ` with [[Special:Diff/${
						diffPart1 === diffPart2 ? diffPart1 : `${diffPart1}/${diffPart2}`
					}|this edit]]`;
				}
				if ( this.copiedTemplateRow.from != null && this.copiedTemplateRow.from.length !== 0 ) {
					attributionString += `; refer to that page's [[Special:PageHistory/${
						this.copiedTemplateRow.from
					}|edit history]] for additional attribution`;
				}
				attributionString += '.';

				copyToClipboard( attributionString );

				if ( lacking ) {
					mw.notify(
						mw.message( 'deputy.cte.copied.entry.copy.lacking' ).text(),
						{ title: mw.message( 'deputy.cte' ).text(), type: 'warn' }
					);
				} else {
					mw.notify(
						mw.message( 'deputy.cte.copied.entry.copy.success' ).text(),
						{ title: mw.message( 'deputy.cte' ).text() }
					);
				}
			} );

			return <div style={{
				float: 'right',
				position: 'absolute',
				top: '0.5em',
				right: '0.5em'
			}}>
				{ unwrapWidget( copyButton )}
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

		}

		/**
		 * Sets up the outline item of this page. Used in the MenuLayout.
		 */
		setupOutlineItem() {
			/** @member any */
			if ( this.outlineItem !== undefined ) {
				/** @member any */
				this.outlineItem
					.setMovable( true )
					.setRemovable( true )
					.setIcon( this.icon )
					.setLevel( this.level )
					.setLabel( this.label );
			}
		}

	};
}

/**
 * Creates a new CopiedTemplateRowPage.
 *
 * @param config Configuration to be passed to the element.
 * @return A CopiedTemplateRowPage object
 */
export default function ( config: CopiedTemplateRowPageData ) {
	if ( !InternalCopiedTemplateRowPage ) {
		initCopiedTemplateRowPage();
	}
	return new InternalCopiedTemplateRowPage( config );
}
