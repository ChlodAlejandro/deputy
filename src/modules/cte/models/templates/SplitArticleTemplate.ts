import { AttributionNoticePageGenerator } from '../../ui/pages/AttributionNoticePageGenerator';
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

	/**
	 * @inheritDoc
	 */
	parse(): void {
		if ( this.node.getParameter( 'from' ) ) {
			this.from = this.node.getParameter( 'from' ).trim();
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
		this.node.setParameter( 'from', this.from );

		const existingParameters = this.node.getParameters();
		for ( const param in existingParameters ) {
			if ( copiedTemplateRowParameters.some( ( v ) => param.startsWith( v ) ) ) {
				// This is a row parameter. Remove it in preparation for rebuild (further below).
				this.node.removeParameter( param );
			}
		}

		this._rows.forEach( ( row, i ) => {
			this.node.setParameter( `to${i > 1 ? i : ''}`, row.to );
			this.node.setParameter( `from_oldid${i > 1 ? i : ''}`, row.from_oldid );
			this.node.setParameter( `date${i > 1 ? i : ''}`, row.date );
			this.node.setParameter( `diff${i > 1 ? i : ''}`, row.diff );
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
