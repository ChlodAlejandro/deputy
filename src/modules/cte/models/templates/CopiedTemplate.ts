import CopiedTemplateRow, {
	copiedTemplateRowParameters,
	ExistingRawCopiedTemplateRow, RawCopiedTemplateRow
} from './CopiedTemplateRow';
import RowChangeEvent from '../../events/RowChangeEvent';
import AttributionNotice from '../AttributionNotice';
import { AttributionNoticePageLayout } from '../../ui/pages/AttributionNoticePageLayout';
import CopiedTemplatePage from '../../ui/pages/CopiedTemplatePage';
import { AttributionNoticePageGenerator } from '../../ui/pages/AttributionNoticePageGenerator';

/**
 * Represents a single {{copied}} template in the Parsoid document.
 */
export default class CopiedTemplate
	extends AttributionNotice implements AttributionNoticePageGenerator {

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
	 * All the rows of this template.
	 */
	private _rows: CopiedTemplateRow[];

	/**
	 * @return This template's rows.
	 */
	get rows(): CopiedTemplateRow[] {
		return this._rows;
	}

	/**
	 * Checks if this current template has row parameters with a given suffix, or no
	 * suffix if not supplied.
	 *
	 * @param suffix The suffix of the parameter
	 * @return `true` if parameters exist
	 * @private
	 */
	private hasRowParameters( suffix: number | '' = '' ): boolean {
		return Object.keys( this.node.getParameters() ).some( ( v ) =>
			copiedTemplateRowParameters.map( ( v2 ) => `${v2}${suffix}` )
				.indexOf( v ) !== -1
		);
	}

	/**
	 * Extracts parameters from `this.node` and returns a {@link CopiedTemplateRow}.
	 *
	 * @param suffix The suffix of the parameter
	 * @return A {@link CopiedTemplateRow}, or null if no parameters were found.
	 * @private
	 */
	private extractRowParameters( suffix: number | '' = '' ): CopiedTemplateRow {
		const row: RawCopiedTemplateRow = {};

		copiedTemplateRowParameters.forEach( ( key ) => {
			if ( this.node.hasParameter( key ) !== undefined ) {
				row[ key ] = this.node.getParameter( key );
			} else if (
				suffix === '' && this.node.getParameter( `${key}1` ) !== undefined
			) {
				// Non-numbered parameter not found but a numbered parameter with
				// an index of 1 was. Fall back to that value.
				row[ key ] = this.node.getParameter( `${key}1` );
			} else if (
				suffix === 1 && this.node.getParameter( `${key}` )
			) {
				// This is i = 1, so fall back to a non-numbered parameter (if exists)
				const unnumberedParamValue = this.node.getParameter( `${key}` );
				if ( unnumberedParamValue !== undefined ) {
					row[ key ] = unnumberedParamValue;
				}
			}
		} );

		return new CopiedTemplateRow( row as ExistingRawCopiedTemplateRow, this );
	}

	/**
	 * Parses parameters into class properties. This WILL destroy unknown
	 * parameters and parameters in the incorrect order!
	 *
	 * This function does not modify the template data.
	 */
	parse() {
		this.accessTemplateData( ( templateData ) => {
			/** @type {Object.<string, {wt: string}>} */

			if ( this.node.getParameter( 'collapse' ) ) {
				this.collapsed = this.node.getParameter( 'collapse' ).trim().length > 0;
			}
			if ( this.node.getParameter( 'small' ) ) {
				this.small = this.node.getParameter( 'small' ).trim().length > 0;
			}

			// Extract {{copied}} rows.
			const rows = [];

			// Numberless
			if ( this.hasRowParameters() ) {
				// If `from`, `to`, ..., or `merge` is found.
				rows.push( this.extractRowParameters() );
			}

			// Numbered
			let i = 1, continueExtracting = true;
			do {
				if ( this.hasRowParameters( i ) ) {
					rows.push( this.extractRowParameters( i ) );
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

			return templateData;
		} );
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
		this.dispatchEvent( new Event( 'destroy' ) );
		this.accessTemplateData( () => undefined );
		// Self-destruct
		Object.keys( this ).forEach( ( k ) => delete ( this as any )[ k ] );
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
	 * Gets the wikitext for this {{copied}} template.
	 *
	 * @return The wikitext for the template
	 */
	toWikitext() {
		let wikitext = '{{';
		this.accessTemplateData( ( data ) => {
			wikitext += data.template.target.wt;
			for ( const key in data.template.params ) {
				if ( !Object.hasOwnProperty.call( data.template.params, key ) ) {
					continue;
				}

				const value = data.template.params[ key ];
				wikitext += `| ${key} = ${value.wt}\n`;
			}
			return data;
		} );
		return wikitext + '}}';
	}

	/**
	 * Adds a row to this template.
	 *
	 * @param row The row to add.
	 */
	addRow( row: CopiedTemplateRow ) {
		this._rows.push( row );
		this.save();
		this.dispatchEvent( new RowChangeEvent( 'rowAdd', row ) );
	}

	/**
	 * Deletes a row to this template.
	 *
	 * @param row The row to delete.
	 */
	deleteRow( row: CopiedTemplateRow ) {
		const i = this._rows.findIndex( ( v ) => v === row );
		if ( i !== -1 ) {
			this._rows.splice( i, 1 );
			this.save();
			this.dispatchEvent( new RowChangeEvent( 'rowDelete', row ) );
		}
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
