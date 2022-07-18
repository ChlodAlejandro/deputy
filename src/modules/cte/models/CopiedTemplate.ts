import CopiedTemplateRow, {
	copiedTemplateRowParameters, ExistingRawCopiedTemplateRow, isCopiedTemplateRowParameter,
	RawCopiedTemplateRow
} from './CopiedTemplateRow';
import { MediaWikiData, TemplateData, TemplateDataModifier } from './MediaWikiData';
import RowChangeEvent from './RowChangeEvent';
import CTEParsoidDocument from './CTEParsoidDocument';

/**
 * Represents a single {{copied}} template in the Parsoid document.
 */
export default class CopiedTemplate extends EventTarget {

	/**
	 * The ParsoidDocument of this template.
	 */
	parsoid: CTEParsoidDocument;
	/**
	 * The Parsoid element of this template.
	 */
	element: HTMLElement;
	/**
	 * The identifier of this template within the {@link MediaWikiData}
	 */
	i: number;
	/**
	 * A unique name for this template.
	 */
	name: string;

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
	 * Creates a new CopiedTemplate class.
	 *
	 * @param parsoidDocument
	 *        The ParsoidDocument of this template. Serves as the context for document
	 *        operations.
	 * @param parsoidElement
	 *        The HTML element from the Parsoid DOM.
	 * @param i
	 *        The identifier of this template within the {@link MediaWikiData}
	 */
	constructor( parsoidDocument: CTEParsoidDocument, parsoidElement: HTMLElement, i: number ) {
		super();
		this.parsoid = parsoidDocument;
		this.element = parsoidElement;
		this.i = i;
		this.name = this.element.getAttribute( 'about' )
			.replace( /^#mwt/, '' ) + '-' + i;
		this.parse();
	}

	/**
	 * Access the element template data and automatically modify the element's
	 * `data-mw` attribute to reflect the possibly-modified data.
	 *
	 * @param callback The callback for data-modifying operations.
	 */
	accessTemplateData( callback: TemplateDataModifier ) {
		const jsonData: MediaWikiData = JSON.parse(
			this.element.getAttribute( 'data-mw' )
		);

		let templateData: TemplateData;
		let index: number;
		jsonData.parts.forEach(
			( v, k ) => {
				if ( v != null && v.template !== undefined && v.template.i === this.i ) {
					templateData = v;
					index = k;
				}
			}
		);
		if ( templateData === undefined ) {
			throw new TypeError( 'Invalid `i` given to template.' );
		}

		templateData = callback( templateData );

		if ( templateData === undefined ) {
			jsonData.parts.splice( index, 1 );
		} else {
			jsonData.parts[ index ] = templateData;
		}

		this.element.setAttribute(
			'data-mw',
			JSON.stringify( jsonData )
		);

		if ( jsonData.parts.length === 0 ) {
			this.parsoid.getDocument().querySelectorAll( `[about="${
				this.element.getAttribute( 'about' )
			}"]` ).forEach( ( e ) => {
				e.parentElement.removeChild( e );
			} );
		}
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
			const params = templateData.template.params;

			// /**
			//  * The parameters of this template.
			//  * @type {Object.<string, string>}
			//  */
			// this.params = Object.fromEntries(
			//     Object.entries(params)
			//         .map(([k, v]) => [k, v.wt])
			// );
			if ( params.collapse !== undefined ) {
				this.collapsed = params.collapse.wt.trim().length > 0;
			}
			if ( params.small !== undefined ) {
				this.small = params.small.wt.trim().length > 0;
			}

			// Extract {{copied}} rows.
			const rows = [];

			// Numberless
			if (
				Object.keys( params ).some(
					( v ) => isCopiedTemplateRowParameter( v )
				)
			) {
				// If `from`, `to`, ..., or `merge` is found.
				const row: Record<string, any> = {};
				copiedTemplateRowParameters.forEach( ( key ) => {
					if ( params[ key ] !== undefined ) {
						row[ key ] = params[ key ].wt;
					} else if ( params[ `${key}1` ] !== undefined ) {
						row[ `${key}1` ] = params[ `${key}1` ].wt;
					}
				} );
				rows.push( new CopiedTemplateRow( row as ExistingRawCopiedTemplateRow, this ) );
			}

			// Numbered
			let i = 1, continueExtracting = true;
			do {
				// Intentional usage.
				// eslint-disable-next-line @typescript-eslint/no-loop-func
				if ( Object.keys( params ).some( ( v ) =>
					copiedTemplateRowParameters.map( ( v2 ) => `${v2}${i}` )
						.indexOf( v ) !== -1
				) ) {
					const row: Record<string, any> = {};
					// Intentional usage.
					// TODO: Have this not trigger ESLint.
					// eslint-disable-next-line @typescript-eslint/no-loop-func
					copiedTemplateRowParameters.forEach( ( key ) => {
						if ( params[ `${key}${i}` ] !== undefined ) {
							row[ key ] = params[ `${key}${i}` ].wt;
						} else if ( i === 1 && params[ key ] !== undefined ) {
							row[ key ] = params[ key ].wt;
						}
					} );
					rows.push( new CopiedTemplateRow( row as ExistingRawCopiedTemplateRow, this ) );
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
		this.accessTemplateData( ( data ) => {
			const params: Record<string, { wt: string }> = {};

			if ( this.collapsed ) {
				params.collapse = { wt: 'yes' };
			}
			if ( this.small ) {
				params.small = { wt: 'yes' };
			}

			if ( this._rows.length === 1 ) {
				for ( const k of copiedTemplateRowParameters ) {
					if ( this._rows[ 0 ][ k ] !== undefined ) {
						params[ k ] = { wt: this._rows[ 0 ][ k ] };
					}
				}
			} else {
				for ( let i = 0; i < this._rows.length; i++ ) {
					for ( const k of copiedTemplateRowParameters ) {
						if ( this._rows[ i ][ k ] !== undefined ) {
							params[ k + ( i === 0 ? '' : i + 1 ) ] = { wt: this._rows[ i ][ k ] };
						}
					}
				}
			}

			data.template.params = params;
			return data;
		} );
		this.dispatchEvent( new Event( 'save' ) );
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
	 * Destroys this template completely.
	 */
	destroy() {
		this.dispatchEvent( new Event( 'destroy' ) );
		this.accessTemplateData( () => undefined );
		// Self-destruct
		Object.keys( this ).forEach( ( k ) => delete ( this as any )[ k ] );
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
	 * Converts this template to parsed HTML.
	 *
	 * @return {Promise<string>}
	 */
	async generatePreview() {
		return new mw.Api().post( {
			action: 'parse',
			format: 'json',
			formatversion: '2',
			utf8: 1,
			title: this.parsoid.getPage(),
			text: this.toWikitext()
		} ).then( ( data ) => data.parse.text );
	}

}
