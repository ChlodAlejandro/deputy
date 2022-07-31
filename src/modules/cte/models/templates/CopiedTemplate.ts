import CopiedTemplateRow, {
	copiedTemplateRowParameters,
	RawCopiedTemplateRow
} from './CopiedTemplateRow';
import { AttributionNoticePageLayout } from '../../ui/pages/AttributionNoticePageLayout';
import CopiedTemplatePage from '../../ui/pages/CopiedTemplatePage';
import { AttributionNoticePageGenerator } from '../../ui/AttributionNoticePageGenerator';
import RowedAttributionNotice from '../RowedAttributionNotice';
import yesNo from '../../../../util/yesNo';

/**
 * Represents a single {{copied}} template in the Parsoid document.
 */
export default class CopiedTemplate
	extends RowedAttributionNotice<CopiedTemplateRow>
	implements AttributionNoticePageGenerator {

	// TEMPLATE OPTIONS

	/**
	 * Whether or not this notice is collapsed (rows hidden if
	 * rows are two or more).
	 */
	collapsed: boolean;
	/**
	 * Whether or not this notice is a right-floating box.
	 */
	small: boolean;

	/**
	 * @return This template's rows.
	 */
	get rows(): CopiedTemplateRow[] {
		return this._rows;
	}

	/**
	 * Parses parameters into class properties. This WILL destroy unknown
	 * parameters and parameters in the incorrect order!
	 *
	 * This function does not modify the template data.
	 */
	parse() {
		if ( this.node.getParameter( 'collapse' ) ) {
			this.collapsed = yesNo( this.node.getParameter( 'collapse' ).trim() );
		}
		if ( this.node.getParameter( 'small' ) ) {
			this.small = yesNo( this.node.getParameter( 'small' ).trim() );
		}

		// Extract {{copied}} rows.
		const rows = [];

		// Numberless
		if ( this.hasRowParameters( copiedTemplateRowParameters ) ) {
			// If `from`, `to`, ..., or `merge` is found.
			rows.push( new CopiedTemplateRow(
				this.extractRowParameters<RawCopiedTemplateRow>(
					copiedTemplateRowParameters
				),
				this
			) );
		}

		// Numbered
		let i = 1, continueExtracting = true;
		do {
			if ( this.hasRowParameters( copiedTemplateRowParameters, i ) ) {
				rows.push( new CopiedTemplateRow(
					this.extractRowParameters<RawCopiedTemplateRow>(
						copiedTemplateRowParameters, i
					),
					this
				) );
			} else if ( !( i === 1 && rows.length > 0 ) ) {
				// Row doesn't exist. Stop parsing from here.
				continueExtracting = false;
			}

			i++;
		} while ( continueExtracting );
		/**
		 * All the rows of this template.
		 *
		 * @type {CopiedTemplateRow[]}
		 */
		this._rows = rows;
	}

	/**
	 * Saves the current template data to the Parsoid element.
	 */
	save() {
		this.node.setParameter( 'collapse', this.collapsed ? 'yes' : null );
		this.node.setParameter( 'small', this.small ? 'yes' : null );

		const existingParameters = this.node.getParameters();
		for ( const param in existingParameters ) {
			if ( copiedTemplateRowParameters.some( ( v ) => param.startsWith( v ) ) ) {
				// This is a row parameter. Remove it in preparation for rebuild (further below).
				this.node.removeParameter( param );
			}
		}

		if ( this._rows.length === 1 ) {
			// If there is only one row, don't bother with numbered rows.
			for ( const param of copiedTemplateRowParameters ) {
				if ( this._rows[ 0 ][ param ] !== undefined ) {
					this.node.setParameter( param, this._rows[ 0 ][ param ] );
				}
			}
		} else {
			// If there are multiple rows, add number prefixes (except for i = 0).
			for ( let i = 0; i < this._rows.length; i++ ) {
				for ( const param of copiedTemplateRowParameters ) {
					if ( this._rows[ i ][ param ] !== undefined ) {
						this.node.setParameter(
							param + ( i === 0 ? '' : i + 1 ),
							this._rows[ i ][ param ]
						);
					}
				}
			}
		}

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
		return CopiedTemplatePage( {
			copiedTemplate: this,
			parent: dialog
		} );
	}

	/**
	 * Copies in the rows of another {@link CopiedTemplate}, and
	 * optionally deletes that template or clears its contents.
	 *
	 * @param template The template to copy from.
	 * @param options Options for this merge.
	 * @param options.delete
	 *        Whether the reference template will be deleted after merging.
	 * @param options.clear
	 *        Whether the reference template's rows will be cleared after merging.
	 */
	merge( template: CopiedTemplate, options: { delete?: boolean, clear?: boolean } = {} ) {
		if ( template.rows === undefined || template === this ) {
			// Deleted or self
			return;
		}
		for ( const row of template.rows ) {
			if ( options.clear ) {
				row.parent = this;
			} else {
				this.addRow( row.clone( this ) );
			}
		}
		if ( options.delete ) {
			template.destroy();
		}
	}

}
