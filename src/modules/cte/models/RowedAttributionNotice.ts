import AttributionNotice from './AttributionNotice';
import RowChangeEvent from '../events/RowChangeEvent';

/**
 * This is a sub-abstract class of {@link AttributionNotice} that represents any
 * attribution notice template that can contain multiple entries (or rows).
 */
export default abstract class RowedAttributionNotice<RowClass>
	extends AttributionNotice {

	/**
	 * All the rows of this template.
	 */
	protected _rows: RowClass[];

	/**
	 * @return This template's rows.
	 */
	get rows(): RowClass[] {
		return this._rows;
	}

	/**
	 * Checks if this current template has row parameters with a given suffix, or no
	 * suffix if not supplied.
	 *
	 * @param parameters The parameter names to check for
	 * @param suffix The suffix of the parameter
	 * @return `true` if parameters exist
	 * @private
	 */
	protected hasRowParameters( parameters: readonly string[], suffix: number | '' = '' ): boolean {
		return Object.keys( this.node.getParameters() ).some( ( v ) =>
			parameters.map( ( v2 ) => `${v2}${suffix}` )
				.indexOf( v ) !== -1
		);
	}

	/**
	 * Extracts parameters from `this.node` and returns a row.
	 *
	 * @param parameters The parameter names to check for
	 * @param suffix The suffix of the parameter
	 * @return A row, or null if no parameters were found.
	 * @private
	 */
	protected extractRowParameters<RowInterface>(
		parameters: readonly string[],
		suffix: number | '' = ''
	): RowInterface {
		const row: Record<string, string> = {};

		parameters.forEach( ( key: string ) => {
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

		return row as unknown as RowInterface;
	}

	/**
	 * Adds a row to this template.
	 *
	 * @param row The row to add.
	 */
	addRow( row: RowClass ) {
		this._rows.push( row );
		this.save();
		this.dispatchEvent( new RowChangeEvent( 'rowAdd', row ) );
	}

	/**
	 * Deletes a row to this template.
	 *
	 * @param row The row to delete.
	 */
	deleteRow( row: RowClass ) {
		const i = this._rows.findIndex( ( v ) => v === row );
		if ( i !== -1 ) {
			this._rows.splice( i, 1 );
			this.save();
			this.dispatchEvent( new RowChangeEvent( 'rowDelete', row ) );
		}
	}

}
