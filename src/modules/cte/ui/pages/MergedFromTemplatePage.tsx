import '../../../../types';
import MergedFromTemplate from '../../models/templates/MergedFromTemplate';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import { h } from 'tsx-dom';

export interface MergedFromTemplatePageData {
	/**
	 * The template that this page refers to.
	 */
	mergedFromTemplate: MergedFromTemplate;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to OOUI's lack of proper TypeScript support.
	 */
	parent: /* mergedFromTemplateEditorDialog */ any;
}

let InternalMergedFromTemplatePage: any;

/**
 * Initializes the process element.
 */
function initMergedFromTemplatePage() {
	InternalMergedFromTemplatePage = class MergedFromTemplatePage
		extends OO.ui.PageLayout
		implements AttributionNoticePageLayout, MergedFromTemplatePageData {

		/**
		 * @inheritDoc
		 */
		mergedFromTemplate: MergedFromTemplate;
		/**
		 * @inheritDoc
		 */
		parent: /* splitArticleTemplateEditorDialog */ any;
		/**
		 * The CTEParsoidDocument that this page refers to.
		 */
		document: CTEParsoidDocument;

		/**
		 * Label for this page.
		 */
		label: string;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: MergedFromTemplatePageData ) {
			const { mergedFromTemplate, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( mergedFromTemplate == null ) {
				throw new Error( 'Reference template (MergedFromTemplate) is required' );
			}

			const label = mw.message(
				'deputy.cte.mergedFrom.label',
				config.mergedFromTemplate.name
			).text();
			const finalConfig = {
				label: label,
				classes: [ 'cte-page-template' ]
			};
			super(
				`${
					mergedFromTemplate.element.getAttribute( 'about' )
				}-${
					mergedFromTemplate.i
				}`,
				finalConfig
			);

			this.document = config.mergedFromTemplate.parsoid;
			this.mergedFromTemplate = config.mergedFromTemplate;
			this.parent = config.parent;
			this.label = label;

			mergedFromTemplate.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );

			this.$element.append( <div>
				{this.mergedFromTemplate.article} || {this.mergedFromTemplate.date} ||
				{this.mergedFromTemplate.talk} || {this.mergedFromTemplate.target} ||
				{this.mergedFromTemplate.afd}
			</div> );
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
 * Creates a new MergedFromTemplatePage.
 *
 * @param config Configuration to be passed to the element.
 * @return A MergedFromTemplatePage object
 */
export default function ( config: MergedFromTemplatePageData ) {
	if ( !InternalMergedFromTemplatePage ) {
		initMergedFromTemplatePage();
	}
	return new InternalMergedFromTemplatePage( config );
}
