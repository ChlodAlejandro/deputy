import CopiedTemplateRow from './CopiedTemplateRow';
import { AttributionNoticePageLayout } from '../../ui/pages/AttributionNoticePageLayout';
import { AttributionNoticePageGenerator } from '../../ui/AttributionNoticePageGenerator';
import RowedAttributionNotice from '../RowedAttributionNotice';
import MergedFromTemplatePage from '../../ui/pages/MergedFromTemplatePage';
import yesNo from '../../../../util/yesNo';

export interface RawMergedFromTemplate {
	/**
	 * The article that content from the target page was originally from.
	 */
	article: string;
	/**
	 * The date of the merge
	 */
	date: string;
	/**
	 * Whether to link to the original article's talk page or not.
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
}
export type MergedFromTemplateParameter = keyof RawMergedFromTemplate;

/**
 * Represents a single {{merged-from}} template in the Parsoid document.
 */
export default class MergedFromTemplate
	extends RowedAttributionNotice<CopiedTemplateRow>
	implements AttributionNoticePageGenerator, RawMergedFromTemplate {

	// TEMPLATE OPTIONS
	/** @inheritDoc */
	article: string;
	/** @inheritDoc */
	date: string;
	/** @inheritDoc */
	talk?: string;
	/** @inheritDoc */
	target?: string;
	/** @inheritDoc */
	afd?: string;

	/**
	 * Parses parameters into class properties. This WILL destroy unknown
	 * parameters and parameters in the incorrect order!
	 *
	 * This function does not modify the template data.
	 */
	parse() {
		if ( this.node.hasParameter( '1' ) ) {
			this.article = this.node.getParameter( '1' );
		}
		if ( this.node.hasParameter( '2' ) ) {
			this.date = this.node.getParameter( '2' );
		}
		if ( this.node.hasParameter( 'talk' ) ) {
			this.talk = this.node.getParameter( 'talk' );
		}
		if ( this.node.hasParameter( 'target' ) ) {
			this.target = this.node.getParameter( 'target' );
		}
		if ( this.node.hasParameter( 'afd' ) ) {
			this.afd = this.node.getParameter( 'afd' );
		}
	}

	/**
	 * Saves the current template data to the Parsoid element.
	 */
	save() {
		this.node.setParameter( '1', this.article );
		this.node.setParameter( '2', this.date );
		if ( this.talk !== undefined ) {
			this.node.setParameter(
				'talk', yesNo( this.talk ) ? null : 'no'
			);
		}
		this.node.setParameter(
			'target', ( this.target ?? '' ).length > 0 ? this.target : null
		);
		this.node.setParameter(
			'afd', ( this.afd ?? '' ).length > 0 ? this.afd : null
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
