import '../../../types';
import CopiedTemplate from '../models/CopiedTemplate';

export interface CopiedTemplatePageData {
	/**
	 * The template that this page refers to.
	 */
	copiedTemplate: CopiedTemplate;
	/**
	 * The parent of this page.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalCopiedTemplatePage: any;

/**
 * Initializes the process element.
 */
function initCopiedTemplatePage() {
	InternalCopiedTemplatePage = class CopiedTemplatePage extends OO.ui.PageLayout {

		data: any;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: CopiedTemplatePageData ) {
			super();
			if ( config.parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( config.copiedTemplate == null ) {
				throw new Error( 'Reference template (CopiedTemplate) is required' );
			}
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
 * Creates a new CopiedTemplatePage.
 *
 * @param config Configuration to be passed to the element.
 * @return A CopiedTemplatePage object
 */
export default function ( config: CopiedTemplatePageData ) {
	if ( !InternalCopiedTemplatePage ) {
		initCopiedTemplatePage();
	}
	return new InternalCopiedTemplatePage( config );
}
