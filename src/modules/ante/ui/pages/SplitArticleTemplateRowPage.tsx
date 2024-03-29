import '../../../../types';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import CopiedTemplateEditorDialog from '../CopiedTemplateEditorDialog';
import SplitArticleTemplateRow, {
	SplitArticleTemplateRowParameter
} from '../../models/templates/SplitArticleTemplateRow';
import { h } from 'tsx-dom';
import getObjectValues from '../../../../util/getObjectValues';
import unwrapWidget from '../../../../util/unwrapWidget';
import RevisionDateGetButton from '../components/RevisionDateGetButton';
import SmartTitleInputWidget from '../components/SmartTitleInputWidget';

export interface SplitArticleTemplateRowPageData {
	/**
	 * The template that this page refers to.
	 */
	splitArticleTemplateRow: SplitArticleTemplateRow;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to lack of proper handling for mw.loader.using calls and the like.
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

		label: string;

		splitArticleTemplateRow: SplitArticleTemplateRow;
		parent: ReturnType<typeof CopiedTemplateEditorDialog>;
		outlineItem: OO.ui.OutlineOptionWidget;
		layout: OO.ui.FieldsetLayout;

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
				classes: [ 'cte-page-row' ]
			};
			super(
				splitArticleTemplateRow.id,
				finalConfig
			);

			this.parent = parent;
			this.splitArticleTemplateRow = splitArticleTemplateRow;
			this.refreshLabel();

			this.splitArticleTemplateRow.parent.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );
			this.splitArticleTemplateRow.parent.addEventListener( 'rowDelete', () => {
				parent.rebuildPages();
			} );

			this.$element.append( this.render().$element );
		}

		/**
		 * Refreshes the page's label
		 */
		refreshLabel(): void {
			this.label = mw.message(
				'deputy.ante.splitArticle.entry.short',
				this.splitArticleTemplateRow.to || '???',
				this.splitArticleTemplateRow.date || '???'
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
		render() {
			this.layout = new OO.ui.FieldsetLayout( {
				icon: 'parameter',
				label: mw.msg( 'deputy.ante.splitArticle.entry.label' ),
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
				title: mw.msg( 'deputy.ante.splitArticle.entry.remove' ),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				this.splitArticleTemplateRow.parent.deleteRow( this.splitArticleTemplateRow );
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
			const rowDate = this.splitArticleTemplateRow.date;
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
				to: SmartTitleInputWidget( {
					$overlay: this.parent.$overlay,
					required: true,
					value: this.splitArticleTemplateRow.to || '',
					placeholder: mw.msg( 'deputy.ante.splitArticle.to.placeholder' )
				} ),
				// eslint-disable-next-line camelcase
				from_oldid: new OO.ui.TextInputWidget( {
					value: this.splitArticleTemplateRow.from_oldid || '',
					placeholder: mw.msg( 'deputy.ante.splitArticle.from_oldid.placeholder' )
				} ),
				diff: new OO.ui.TextInputWidget( {
					value: this.splitArticleTemplateRow.from_oldid || '',
					placeholder: mw.msg( 'deputy.ante.splitArticle.diff.placeholder' ),
					validate: ( value: string ) => {
						if (
							// Blank
							value.trim().length === 0 ||
							// Diff number
							!isNaN( +value )
						) {
							return true;
						}
						try {
							return typeof new URL( value ).href === 'string';
						} catch ( e ) {
							return false;
						}
					}
				} ),
				date: new mw.widgets.DateInputWidget( {
					$overlay: this.parent.$overlay,
					required: true,
					icon: 'calendar',
					value: parsedDate ? `${
						parsedDate.getUTCFullYear()
					}-${
						parsedDate.getUTCMonth() + 1
					}-${
						parsedDate.getUTCDate()
					}` : undefined,
					placeholder: mw.msg( 'deputy.ante.copied.date.placeholder' ),
					calendar: {
						verticalPosition: 'above'
					}
				} )
			};

			const dateAuto = RevisionDateGetButton( {
				label: mw.msg( 'deputy.ante.dateAuto', 'diff' ),
				revisionInputWidget: inputs.diff,
				dateInputWidget: inputs.date
			} );

			const fieldLayouts = {
				to: new OO.ui.FieldLayout( inputs.to, {
					$overlay: this.parent.$overlay,
					align: 'top',
					label: mw.msg( 'deputy.ante.splitArticle.to.label' ),
					help: mw.msg( 'deputy.ante.splitArticle.to.help' )
				} ),
				// eslint-disable-next-line camelcase
				from_oldid: new OO.ui.FieldLayout( inputs.from_oldid, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.msg( 'deputy.ante.splitArticle.from_oldid.label' ),
					help: mw.msg( 'deputy.ante.splitArticle.from_oldid.help' )
				} ),
				diff: new OO.ui.FieldLayout( inputs.diff, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.msg( 'deputy.ante.splitArticle.diff.label' ),
					help: mw.msg( 'deputy.ante.splitArticle.diff.help' )
				} ),
				date: new OO.ui.ActionFieldLayout( inputs.date, dateAuto, {
					$overlay: this.parent.$overlay,
					align: 'left',
					label: mw.msg( 'deputy.ante.splitArticle.date.label' ),
					help: mw.msg( 'deputy.ante.splitArticle.date.help' )
				} )
			};

			for ( const _field in inputs ) {
				const field = _field as SplitArticleTemplateRowParameter;
				const input = inputs[ field ];

				// Attach the change listener
				input.on( 'change', ( value: string ) => {
					if ( input instanceof mw.widgets.DateInputWidget ) {
						this.splitArticleTemplateRow[ field ] = value ?
							window.moment( value, 'YYYY-MM-DD' )
								.locale( mw.config.get( 'wgContentLanguage' ) )
								.format( 'D MMMM Y' ) : undefined;
						if ( value.length > 0 ) {
							fieldLayouts[ field ].setWarnings( [] );
						}
					} else {
						this.splitArticleTemplateRow[ field ] = value;
					}
					this.splitArticleTemplateRow.parent.save();
				} );

				if ( input instanceof OO.ui.TextInputWidget ) {
					// Rechecks the validity of the field.
					input.setValidityFlag();
				}
			}

			inputs.to.on( 'change', () => {
				this.refreshLabel();
			} );
			inputs.date.on( 'change', () => {
				this.refreshLabel();
			} );

			return getObjectValues( fieldLayouts );
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
