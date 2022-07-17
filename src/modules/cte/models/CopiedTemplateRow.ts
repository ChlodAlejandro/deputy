/**
 * Copied template rows as strings.
 */
import CopiedTemplate from './CopiedTemplate';

export const copiedTemplateRowParameters = <const>[
	'from', 'from_oldid', 'to', 'to_diff',
	'to_oldid', 'diff', 'date', 'afd', 'merge'
];
export type CopiedTemplateRowParameter = typeof copiedTemplateRowParameters[number];

/**
 * Checks if a given string key is a valid {{copied}} template row parameter.
 *
 * @param key
 * @return `true` if a string is a {{copied}} template row parameter.
 */
export function isCopiedTemplateRowParameter( key: string ): key is CopiedTemplateRowParameter {
	return ( copiedTemplateRowParameters as readonly string[] ).indexOf( key ) !== -1;
}

/**
 * Represents a row in the {{copied}} template. These should represent
 * their actual values instead of raw parameters from the template.
 */
export interface RawCopiedTemplateRow {
	/**
	 * The original article.
	 */
	from: string;
	/**
	 * The revision ID from which the content was copied from.
	 */
	from_oldid?: string;
	/**
	 * The article that content was copied into.
	 */
	to?: string;
	/**
	 * The revision number of the copying diff.
	 */
	to_diff?: string;
	/**
	 * The oldid of the copying diff (for multiple edits).
	 */
	to_oldid?: string;
	/**
	 * The URL of the copying diff. Overrides to_diff and to_oldid.
	 */
	diff?: string;
	/**
	 * The date when the copy was performed.
	 */
	date?: string;
	/**
	 * Whether or not this copy was made from the results of an AfD discussion.
	 */
	afd?: string;
	/**
	 * Whether or not this copy was made from the results of a merge discussion.
	 */
	merge?: string;
}

/**
 * Represents a row/entry in a {{copied}} template.
 */
export default class CopiedTemplateRow implements RawCopiedTemplateRow {

	/** @inheritDoc **/
	from: string;
	/** @inheritDoc **/
	// eslint-disable-next-line camelcase
	from_oldid: string;
	/** @inheritDoc **/
	to: string;
	/** @inheritDoc **/
	// eslint-disable-next-line camelcase
	to_diff: string;
	/** @inheritDoc **/
	// eslint-disable-next-line camelcase
	to_oldid: string;
	/** @inheritDoc **/
	diff: string;
	/** @inheritDoc **/
	date: string;
	/** @inheritDoc **/
	afd: string;
	/** @inheritDoc **/
	merge: string;

	id: string;

	/**
	 * The parent of a given copied template row. This is the {{copied}} template
	 * that this row is a part of.
	 */
	private _parent: CopiedTemplate;

	/**
	 * @return The parent of a given copied template row. This is the {{copied}}
	 * template that this row is a part of.
	 */
	get parent() {
		return this._parent;
	}

	/**
	 * Sets the parent. Automatically moves this template from one
	 * parent's row set to another.
	 *
	 * @param newParent The new parent.
	 */
	set parent( newParent ) {
		this._parent.deleteRow( this );
		newParent.addRow( this );
		this._parent = newParent;
	}

	/**
	 * Creates a new RawCopiedTemplateRow
	 *
	 * @param rowObjects
	 * @param parent
	 */
	constructor( rowObjects: RawCopiedTemplateRow, parent: CopiedTemplate ) {
		this.from = rowObjects.from;
		// eslint-disable-next-line camelcase
		this.from_oldid = rowObjects.from_oldid;
		this.to = rowObjects.to;
		// eslint-disable-next-line camelcase
		this.to_diff = rowObjects.to_diff;
		// eslint-disable-next-line camelcase
		this.to_oldid = rowObjects.to_oldid;
		this.diff = rowObjects.diff;
		this.date = rowObjects.date;
		this.afd = rowObjects.afd;
		this.merge = rowObjects.merge;

		// Clean all zero-length parameters.
		for ( const param of copiedTemplateRowParameters ) {
			if ( this[ param ] && this[ param ].trim && this[ param ].trim().length === 0 ) {
				delete this[ param ];
			}
		}

		this._parent = parent;
		this.id = btoa( `${Math.random() * 0.1}`.slice( 5 ) );
	}

	/**
	 * Clones this row.
	 *
	 * @param parent The parent of this new row.
	 * @return The cloned row
	 */
	clone( parent: CopiedTemplate ): CopiedTemplateRow {
		// noinspection JSCheckFunctionSignatures
		return new CopiedTemplateRow( this, parent );
	}

}
