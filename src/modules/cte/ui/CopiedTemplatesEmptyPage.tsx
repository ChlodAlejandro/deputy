import '../../../types';
import CTEParsoidDocument from '../models/CTEParsoidDocument';
import { h } from 'tsx-dom';

export interface CopiedTemplatesEmptyPageData {
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

let InternalCopiedTemplatesEmptyPage: any;

/**
 * Initializes the process element.
 */
function initCopiedTemplatesEmptyPage() {
	InternalCopiedTemplatesEmptyPage = class CopiedTemplatesEmptyPage
		extends OO.ui.PageLayout implements CopiedTemplatesEmptyPageData {

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
		constructor( config: CopiedTemplatesEmptyPageData ) {
			const finalConfig = {
				label: 'No templates',
				icon: 'puzzle',
				level: 0
			};
			super( 'cte-no-templates', finalConfig );

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
						this.parsoid.originalNoticeCount > 0 ?
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
 * Creates a new CopiedTemplatesEmptyPage.
 *
 * @param config Configuration to be passed to the element.
 * @return A CopiedTemplatesEmptyPage object
 */
export default function ( config: CopiedTemplatesEmptyPageData ) {
	if ( !InternalCopiedTemplatesEmptyPage ) {
		initCopiedTemplatesEmptyPage();
	}
	return new InternalCopiedTemplatesEmptyPage( config );
}
