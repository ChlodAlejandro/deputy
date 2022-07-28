import { AttributionNoticePageGenerator } from '../../ui/AttributionNoticePageGenerator';
import { AttributionNoticePageLayout } from '../../ui/pages/AttributionNoticePageLayout';
import { copiedTemplateRowParameters } from './CopiedTemplateRow';
import SplitArticleTemplateRow, {
	RawSplitArticleTemplateRow,
	splitArticleTemplateRowParameters
} from './SplitArticleTemplateRow';
import RowedAttributionNotice from '../RowedAttributionNotice';
import SplitArticleTemplatePage from '../../ui/pages/SplitArticleTemplatePage';

/**
 * Represents a single {{split article}} template.
 */
export default class SplitArticleTemplate
	extends RowedAttributionNotice<SplitArticleTemplateRow>
	implements AttributionNoticePageGenerator {

	from: string;
	collapse: boolean;

	/**
	 * @inheritDoc
	 */
	parse(): void {
		if ( this.node.hasParameter( 'from' ) ) {
			this.from = this.node.getParameter( 'from' ).trim();
		}
		if ( this.node.hasParameter( 'collapse' ) ) {
			this.collapse = this.node.getParameter( 'collapse' ).trim().length > 0;
		}

		// Extract {{copied}} rows.
		const rows = [];

		// Numberless
		if ( this.hasRowParameters( splitArticleTemplateRowParameters ) ) {
			// If `from`, `to`, ..., or `merge` is found.
			rows.push( new SplitArticleTemplateRow(
				this.extractRowParameters<RawSplitArticleTemplateRow>(
					splitArticleTemplateRowParameters
				),
				this
			) );
		}

		// Numbered
		let i = 1, continueExtracting = true;
		do {
			if ( this.hasRowParameters( splitArticleTemplateRowParameters, i ) ) {
				rows.push( new SplitArticleTemplateRow( this.extractRowParameters(
					splitArticleTemplateRowParameters, i
				), this ) );
			} else if ( !( i === 1 && rows.length > 0 ) ) {
				// Row doesn't exist. Stop parsing from here.
				continueExtracting = false;
			}

			i++;
			// Hard limit to `i` added due to the template's construction.
			// TODO: Modify template to allow more than 10.
		} while ( continueExtracting && i <= 10 );

		this._rows = rows;
	}

	/**
	 *
	 * @inheritDoc
	 */
	save(): void {
		const existingParameters = this.node.getParameters();
		for ( const param in existingParameters ) {
			if ( copiedTemplateRowParameters.some( ( v ) => param.startsWith( v ) ) ) {
				// This is a row parameter. Remove it in preparation for rebuild (further below).
				this.node.removeParameter( param );
			}
		}

		this.node.setParameter( 'collapse', this.collapse ? 'yes' : null );
		this.node.setParameter( 'from', this.from );

		this._rows.forEach( ( row, i ) => {
			this.node.setParameter( `to${i > 0 ? i + 1 : ''}`, row.to );
			this.node.setParameter( `from_oldid${i > 0 ? i + 1 : ''}`, row.from_oldid );
			this.node.setParameter( `date${i > 0 ? i + 1 : ''}`, row.date );
			this.node.setParameter( `diff${i > 0 ? i + 1 : ''}`, row.diff );
		} );

		this.dispatchEvent( new Event( 'save' ) );
	}

	/**
	 *
	 * @inheritDoc
	 */
	destroy(): void {
		this.dispatchEvent( new Event( 'destroy' ) );
		this.accessTemplateData( () => undefined );
		// Self-destruct
		Object.keys( this ).forEach( ( k ) => delete ( this as any )[ k ] );
	}

	/**
	 * @inheritDoc
	 */
	generatePage( dialog: any ): AttributionNoticePageLayout {
		return SplitArticleTemplatePage( {
			splitArticleTemplate: this,
			parent: dialog
		} );
	}

}
