import CopiedTemplateRow, {
	copiedTemplateRowParameters,
	RawCopiedTemplateRow
} from './CopiedTemplateRow';
import { AttributionNoticePageLayout } from '../../ui/pages/AttributionNoticePageLayout';
import CopiedTemplatePage from '../../ui/pages/CopiedTemplatePage';
import { AttributionNoticePageGenerator } from '../../ui/AttributionNoticePageGenerator';
import RowedAttributionNotice from '../RowedAttributionNotice';
import MergedFromTemplatePage from '../../ui/pages/MergedFromTemplatePage';

/**
 * Represents a single {{merged-from}} template in the Parsoid document.
 */
export default class MergedFromTemplate
	extends RowedAttributionNotice<CopiedTemplateRow>
	implements AttributionNoticePageGenerator {

	// TEMPLATE OPTIONS
	/**
	 * The article that content from the target page was originally from.
	 */
	article: string;
	/**
	 * The date of the merge
	 */
	date: string;
	/**
	 * If the merge discussion occurred on a talk page that is not the target
	 * page's talk page, this should be supplied with the page title of that talk
	 * page.
	 */
	talk?: string;
	/**
	 * The target of the merge.
	 */
	target?: string;
	/**
	 * If the merge was the result of an AfD, this should be the full page title
	 * of the AfD discussion.
	 *
	 * @example "Wikipedia:Articles for deletion/Wikipedia"
	 */
	afd?: string;

	/**
	 * Parses parameters into class properties. This WILL destroy unknown
	 * parameters and parameters in the incorrect order!
	 *
	 * This function does not modify the template data.
	 */
	parse() {
		if ( this.node.hasParameter( '1' ) ) {
			this.article = this.node.getParameter( '1' ).trim();
		}
		if ( this.node.hasParameter( '2' ) ) {
			this.date = this.node.getParameter( '2' ).trim();
		}
		if ( this.node.hasParameter( 'talk' ) ) {
			this.talk = this.node.getParameter( 'talk' ).trim();
		}
		if ( this.node.hasParameter( 'target' ) ) {
			this.target = this.node.getParameter( 'target' ).trim();
		}
		if ( this.node.hasParameter( 'afd' ) ) {
			this.afd = this.node.getParameter( 'afd' ).trim();
		}
	}

	/**
	 * Saves the current template data to the Parsoid element.
	 */
	save() {
		this.node.setParameter( '1', this.article.trim() );
		this.node.setParameter( '2', this.date.trim() );
		this.node.setParameter(
			'talk', this.talk.trim().length > 0 ? this.talk.trim() : null
		);
		this.node.setParameter(
			'target', this.target.trim().length > 0 ? this.target.trim() : null
		);
		this.node.setParameter(
			'afd', this.afd.trim().length > 0 ? this.afd.trim() : null
		);

		this.dispatchEvent( new Event( 'save' ) );
	}

	/**
	 * Destroys this template completely.
	 */
	destroy() {
		this.node.destroy();
		// Self-destruct
		Object.keys( this ).forEach( ( k ) => delete ( this as any )[ k ] );
		this.dispatchEvent( new Event( 'destroy' ) );
	}

	/**
	 * @inheritDoc
	 */
	generatePage( dialog: any ): AttributionNoticePageLayout {
		return MergedFromTemplatePage( {
			mergedFromTemplate: this,
			parent: dialog
		} );
	}

}
