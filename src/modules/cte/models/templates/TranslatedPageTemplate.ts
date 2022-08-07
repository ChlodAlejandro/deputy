import { AttributionNoticePageLayout } from '../../ui/pages/AttributionNoticePageLayout';
import { AttributionNoticePageGenerator } from '../../ui/AttributionNoticePageGenerator';
import yesNo from '../../../../util/yesNo';
import AttributionNotice from '../AttributionNotice';
import TranslatedPageTemplatePage from '../../ui/pages/TranslatedPageTemplatePage';

export interface RawTranslatedPageTemplate {
	/**
	 * Language code of the source page. Actual parameter name is '1'.
	 */
	lang: string;
	/**
	 * Title of the source page. Actual parameter name is '2'.
	 */
	page: string;
	/**
	 * Additional pertinent information. Not period-appended.
	 * Actual parameter name is '3'.
	 */
	comments: string;
	/**
	 * The `oldid` for the source page at the time translation was done.
	 */
	version: string;
	/**
	 * The `oldid` for the subject page (the page that translated content was copied into)
	 * at the time translation was done.
	 */
	insertversion: string;
	/**
	 * If only a section was translated, the name of the section.
	 */
	section: string;
	/**
	 * Whether to enable or disable small mode. Defaults to `yes`.
	 */
	small: string;
	/**
	 * Supplied with any value to indicate that the translation was partial.
	 */
	partial: string;
}
export type MergedToTemplateParameter = keyof RawTranslatedPageTemplate
	| '1' | '2' | '3';

/**
 * Represents a single {{merged-from}} template in the Parsoid document.
 */
export default class TranslatedPageTemplate
	extends AttributionNotice
	implements AttributionNoticePageGenerator, RawTranslatedPageTemplate {

	// TEMPLATE OPTIONS
	/** @inheritdoc */
	lang: string;
	/** @inheritdoc */
	page: string;
	/** @inheritdoc */
	comments: string;
	/** @inheritdoc */
	version: string;
	/** @inheritdoc */
	insertversion: string;
	/** @inheritdoc */
	section: string;
	/** @inheritdoc */
	small: string;
	/** @inheritdoc */
	partial: string;

	/**
	 * @inheritDoc
	 */
	parse() {
		this.lang = this.node.getParameter( '1' );
		this.page = this.node.getParameter( '2' );
		this.comments = this.node.getParameter( '3' );
		this.version = this.node.getParameter( 'version' );
		this.insertversion = this.node.getParameter( 'insertversion' );
		this.section = this.node.getParameter( 'section' );
		this.small = this.node.getParameter( 'small' );
		this.partial = this.node.getParameter( 'partial' );
	}

	/**
	 * @inheritDoc
	 */
	save() {
		this.node.setParameter( '1', this.lang );
		this.node.setParameter( '2', this.page );
		this.node.setParameter( '3', this.comments );
		this.node.setParameter( 'version', this.version );
		this.node.setParameter( 'insertversion', this.insertversion );
		this.node.setParameter( 'section', this.section );

		if ( this.small !== undefined ) {
			this.node.setParameter(
				'small', yesNo( this.small ) ? null : 'no'
			);
		}
		if ( this.partial !== undefined ) {
			this.node.setParameter(
				'partial', yesNo( this.partial ) ? 'yes' : null
			);
		}

		this.dispatchEvent( new Event( 'save' ) );
	}

	/**
	 * @inheritDoc
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
		return TranslatedPageTemplatePage( {
			translatedPageTemplate: this,
			parent: dialog
		} );
	}

}
