import { h } from 'tsx-dom';
import '../../../../types';
import BackwardsCopyTemplateRow, {
	BackwardsCopyTemplateRowParameter
} from '../../models/templates/BackwardsCopyTemplateRow';
import unwrapWidget from '../../../../util/unwrapWidget';
import CopiedTemplateEditorDialog from '../CopiedTemplateEditorDialog';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import getObjectValues from '../../../../util/getObjectValues';
import matchAll from '../../../../util/matchAll';

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

		// OOUI
		outlineItem: OO.ui.OutlineOptionWidget|null;

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
		layout: OO.ui.FieldsetLayout;
		/**
		 * An array of OOUI InputWidget widgets that represent the fields of this row.
		 */
		inputs: Record<BackwardsCopyTemplateRowParameter | 'toggle',
			OO.ui.TagMultiselectWidget | OO.ui.TextInputWidget>;
		/**
		 * An array of OOUI FieldLayout widgets that contain inputs for this row.
		 */
		fieldLayouts: Record<BackwardsCopyTemplateRowParameter | 'toggle', OO.ui.FieldLayout>;
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
			this.backwardsCopyTemplateRow.parent.addEventListener( 'save', () => {
				this.refreshLabel();
			} );

			this.$element.append( this.render().$element );
		}

		/**
		 * Refreshes the page's label
		 */
		refreshLabel(): void {
			this.label = mw.message(
				'deputy.ante.backwardsCopy.entry.short',
				this.backwardsCopyTemplateRow.title || '???'
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
		render(): OO.ui.FieldsetLayout {
			this.layout = new OO.ui.FieldsetLayout( {
				icon: 'parameter',
				label: mw.msg( 'deputy.ante.copied.entry.label' ),
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
				title: mw.msg( 'deputy.ante.backwardsCopy.entry.remove' ),
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
		renderFields(): OO.ui.FieldLayout[] {
			// Use order: `date`, `monthday` + `year`, `year`
			const rowDate = this.backwardsCopyTemplateRow.date ??
				(
					this.backwardsCopyTemplateRow.monthday ?
						`${
							this.backwardsCopyTemplateRow.monthday
						} ${
							this.backwardsCopyTemplateRow.year
						}` :
						this.backwardsCopyTemplateRow.year
				);

			// TODO: ANTE l10n
			const authorRegex = /(.+?, (?:[A-Z]\.\s?)*)(?:(?:&amp;|[&;]|[,;] (?:&amp;|[&;])?)\s*|$)/g;
			const authors = matchAll(
				authorRegex,
				this.backwardsCopyTemplateRow.authorlist ??
				this.backwardsCopyTemplateRow.author
			).map( ( v ) => v[ 1 ] );

			const inputs = {
				title: new OO.ui.TextInputWidget( {
					required: true,
					placeholder: mw.msg( 'deputy.ante.backwardsCopy.entry.title.placeholder' ),
					value: this.backwardsCopyTemplateRow.title ??
						this.backwardsCopyTemplateRow.articlename
				} ),
				date: new OO.ui.TextInputWidget( {
					placeholder: mw.msg( 'deputy.ante.backwardsCopy.entry.date.placeholder' ),
					value: rowDate
				} ),
				author: new OO.ui.TextInputWidget( {
					placeholder: mw.msg( 'deputy.ante.backwardsCopy.entry.author.placeholder' ),
					value: authors[ 0 ] ?? this.backwardsCopyTemplateRow.author
				} ),
				url: new OO.ui.TextInputWidget( {
					placeholder: mw.msg( 'deputy.ante.backwardsCopy.entry.url.placeholder' ),
					value: this.backwardsCopyTemplateRow.url,
					validate: ( value: string ) => {
						if ( value.trim().length === 0 ) {
							return true;
						}
						try {
							return typeof new URL( value ).href === 'string';
						} catch ( e ) {
							return false;
						}
					}
				} ),
				org: new OO.ui.TextInputWidget( {
					placeholder: mw.msg( 'deputy.ante.backwardsCopy.entry.org.placeholder' ),
					value: this.backwardsCopyTemplateRow.org
				} )
			};
			const fields = {
				title: new OO.ui.FieldLayout( inputs.title, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.backwardsCopy.entry.title.label' ),
					align: 'top',
					help: mw.msg( 'deputy.ante.backwardsCopy.entry.title.help' )
				} ),
				date: new OO.ui.FieldLayout( inputs.date, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.backwardsCopy.entry.date.label' ),
					align: 'left',
					help: mw.msg( 'deputy.ante.backwardsCopy.entry.date.help' )
				} ),
				author: new OO.ui.FieldLayout( inputs.author, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.backwardsCopy.entry.author.label' ),
					align: 'left',
					help: mw.msg( 'deputy.ante.backwardsCopy.entry.author.help' )
				} ),
				url: new OO.ui.FieldLayout( inputs.url, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.backwardsCopy.entry.url.label' ),
					align: 'left',
					help: mw.msg( 'deputy.ante.backwardsCopy.entry.url.help' )
				} ),
				org: new OO.ui.FieldLayout( inputs.org, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.backwardsCopy.entry.org.label' ),
					align: 'left',
					help: mw.msg( 'deputy.ante.backwardsCopy.entry.org.help' )
				} )
			};

			for ( const _field in inputs ) {
				const field = _field as keyof typeof inputs;
				const input = inputs[ field ];

				input.on( 'change', ( value: string ) => {
					this.backwardsCopyTemplateRow[ field ] = value;
					this.backwardsCopyTemplateRow.parent.save();
				} );

				if ( input instanceof OO.ui.TextInputWidget ) {
					// Rechecks the validity of the field.
					input.setValidityFlag();
				}
			}

			return getObjectValues( fields );
		}

		/**
		 * Sets up the outline item of this page. Used in the BookletLayout.
		 */
		setupOutlineItem() {
			if ( this.outlineItem !== undefined ) {
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
