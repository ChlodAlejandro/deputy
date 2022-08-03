import CopiedTemplateRow from './CopiedTemplateRow';
import { AttributionNoticePageLayout } from '../../ui/pages/AttributionNoticePageLayout';
import { AttributionNoticePageGenerator } from '../../ui/AttributionNoticePageGenerator';
import RowedAttributionNotice from '../RowedAttributionNotice';
import MergedToTemplatePage from '../../ui/pages/MergedToTemplatePage';
import yesNo from '../../../../util/yesNo';

export interface RawMergedToTemplate {
	/**
	 * The article that content from the source page was merged into.
	 */
	to: string;
	/**
	 * The date of the merge
	 */
	date: string;
	/**
	 * Whether the template should be small or not
	 */
	small?: string;
}
export type MergedToTemplateParameter = keyof RawMergedToTemplate;

/**
 * Represents a single {{merged-from}} template in the Parsoid document.
 */
export default class MergedToTemplate
	extends RowedAttributionNotice<CopiedTemplateRow>
	implements AttributionNoticePageGenerator, RawMergedToTemplate {

	// TEMPLATE OPTIONS
	/** @inheritDoc */
	to: string;
	/** @inheritDoc */
	date: string;
	/** @inheritDoc */
	small?: string;

	/**
	 * Parses parameters into class properties. This WILL destroy unknown
	 * parameters and parameters in the incorrect order!
	 *
	 * This function does not modify the template data.
	 */
	parse() {
		if ( this.node.hasParameter( 'to' ) ) {
			this.to = this.node.getParameter( 'to' );
		} else if ( this.node.hasParameter( '1' ) ) {
			this.to = this.node.getParameter( '1' );
		}
		if ( this.node.hasParameter( 'date' ) ) {
			this.date = this.node.getParameter( 'date' );
		} else if ( this.node.hasParameter( '2' ) ) {
			this.date = this.node.getParameter( '2' );
		}
		if ( this.node.hasParameter( 'small' ) ) {
			this.small = this.node.getParameter( 'small' );
		}
	}

	/**
	 * Saves the current template data to the Parsoid element.
	 */
	save() {
		// Reset named parameters
		this.node.setParameter( 'to', null );
		this.node.setParameter( 'date', null );

		this.node.setParameter( '1', this.to );
		this.node.setParameter( '2', this.date );
		this.node.setParameter(
			'small', yesNo( this.small, false ) ? 'yes' : null
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
		return MergedToTemplatePage( {
			mergedToTemplate: this,
			parent: dialog
		} );
	}

}
