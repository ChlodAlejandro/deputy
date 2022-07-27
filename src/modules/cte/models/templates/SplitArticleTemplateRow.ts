import SplitArticleTemplate from './SplitArticleTemplate';
import CopiedTemplateRowPage from '../../ui/pages/CopiedTemplateRowPage';
import { AttributionNoticeRow } from '../AttributionNoticeRow';
import SplitArticleTemplateRowPage from '../../ui/pages/SplitArticleTemplateRowPage';

export interface RawSplitArticleTemplateRow {
	to: string;
	from_oldid: string;
	date: string;
	diff?: string;
}

export const splitArticleTemplateRowParameters = <const>[
	'to', 'from_oldid', 'date', 'diff'
];

/**
 * Represents a row/entry in a {{split article}} template.
 */
export default class SplitArticleTemplateRow
	extends AttributionNoticeRow<SplitArticleTemplate>
	implements RawSplitArticleTemplateRow {

	/** @inheritDoc **/
	to: string;
	/** @inheritDoc **/
	// eslint-disable-next-line camelcase
	from_oldid: string;
	/** @inheritDoc **/
	date: string;
	/** @inheritDoc **/
	diff: string;

	id: string;

	/**
	 * The parent of a given copied template row. This is the {{split article}} template
	 * that this row is a part of.
	 */
	private _parent: SplitArticleTemplate;

	/**
	 * @return The parent of a given copied template row. This is the {{split article}}
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
	constructor( rowObjects: RawSplitArticleTemplateRow, parent: SplitArticleTemplate ) {
		super();

		this.to = rowObjects.to;
		// eslint-disable-next-line camelcase
		this.from_oldid = rowObjects.from_oldid;
		this.date = rowObjects.date;
		this.diff = rowObjects.diff;

		// Clean all zero-length parameters.
		for ( const param of splitArticleTemplateRowParameters ) {
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
	clone( parent: SplitArticleTemplate ): SplitArticleTemplateRow {
		// noinspection JSCheckFunctionSignatures
		return new SplitArticleTemplateRow( this, parent );
	}

	/**
	 * @inheritDoc
	 */
	generatePage( dialog: any ): ReturnType<typeof CopiedTemplateRowPage> {
		return SplitArticleTemplateRowPage( {
			splitArticleTemplateRow: this,
			parent: dialog
		} );
	}
}
