import '../../../../types';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import { h } from 'tsx-dom';
import AttributionNoticeAddMenu from '../AttributionNoticeAddMenu';

export interface AttributionNoticesEmptyPageData {
	/**
	 * The original document handling the dialog.
	 */
	parsoid: CTEParsoidDocument;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to lack of proper handling for mw.loader.using calls and the like.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalAttributionNoticesEmptyPage: any;

/**
 * Initializes the process element.
 */
function initAttributionNoticesEmptyPage() {
	InternalAttributionNoticesEmptyPage = class AttributionNoticesEmptyPage
		extends OO.ui.PageLayout implements AttributionNoticesEmptyPageData {

		// OOUI
		outlineItem: OO.ui.OutlineOptionWidget|null;

		/**
		 * @inheritdoc
		 */
		parsoid: CTEParsoidDocument;
		/**
		 * @inheritdoc
		 */
		parent: /* CopiedTemplateEditorDialog */ any;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: AttributionNoticesEmptyPageData ) {
			super( 'cte-no-templates', {} );

			this.parent = config.parent;
			this.parsoid = config.parsoid;
			const addListener = this.parent.layout.on( 'add', () => {
				for ( const name of Object.keys( this.parent.layout.pages ) ) {
					if ( name !== 'cte-no-templates' && this.outlineItem !== null ) {
						// Pop this page out if a page exists.
						this.parent.layout.removePages( [ this ] );
						this.parent.layout.off( addListener );
						return;
					}
				}
			} );

			// Render the page.
			const add = new OO.ui.ButtonWidget( {
				icon: 'add',
				label: mw.msg( 'deputy.ante.empty.add' ),
				flags: [ 'progressive' ]
			} );

			this.parent.$overlay.append(
				new AttributionNoticeAddMenu(
					this.parsoid, add
				).render()
			);
			this.$element.append(
				<h3>{
					mw.msg( 'deputy.ante.empty.header' )
				}</h3>,
				<p>{
					mw.message(
						this.parsoid.originalCount > 0 ?
							'deputy.ante.empty.removed' :
							'deputy.ante.empty.none'
					).text()
				}</p>,
				add.$element
			);
		}

		/**
		 * Sets up the outline item of this page. Used in the BookletLayout.
		 */
		setupOutlineItem() {
			if ( this.outlineItem !== undefined ) {
				this.outlineItem.toggle( false );
			}
		}

	};
}

/**
 * Creates a new AttributionNoticesEmptyPage.
 *
 * @param config Configuration to be passed to the element.
 * @return A AttributionNoticesEmptyPage object
 */
export default function ( config: AttributionNoticesEmptyPageData ) {
	if ( !InternalAttributionNoticesEmptyPage ) {
		initAttributionNoticesEmptyPage();
	}
	return new InternalAttributionNoticesEmptyPage( config );
}
