import '../../../../types';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import { h } from 'tsx-dom';

export interface AttributionNoticesEmptyPageData {
	/**
	 * The original document handling the dialog.
	 */
	parsoid: CTEParsoidDocument;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to OOUI's lack of proper TypeScript support.
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
					/** @member any */
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
				label: mw.message( 'deputy.cte.empty.add' ).text(),
				flags: [ 'progressive' ]
			} );
			add.on( 'click', () => {
				this.parent.addTemplate();
			} );

			this.$element.append(
				<h3>{
					mw.message( 'deputy.cte.empty.header' ).text()
				}</h3>,
				<p>{
					mw.message(
						this.parsoid.originalCount > 0 ?
							'deputy.cte.empty.removed' :
							'deputy.cte.empty.none'
					).text()
				}</p>,
				add.$element
			);
		}

		/**
		 * Sets up the outline item of this page. Used in the BookletLayout.
		 */
		setupOutlineItem() {
			/** @member any */
			if ( this.outlineItem !== undefined ) {
				/** @member any */
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
