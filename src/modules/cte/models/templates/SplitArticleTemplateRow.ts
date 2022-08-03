// noinspection JSDeprecatedSymbols

import SplitArticleTemplate from './SplitArticleTemplate';
import CopiedTemplateRowPage from '../../ui/pages/CopiedTemplateRowPage';
import { AttributionNoticeRow } from '../AttributionNoticeRow';
import SplitArticleTemplateRowPage from '../../ui/pages/SplitArticleTemplateRowPage';

export interface RawSplitArticleTemplateRow {
	to?: string;
	from_oldid?: string;
	date?: string;
	diff?: string;
}

export const splitArticleTemplateRowParameters = <const>[
	'to', 'from_oldid', 'date', 'diff'
];
export type SplitArticleTemplateRowParameter = typeof splitArticleTemplateRowParameters[number];

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

		this._parent = parent;
		this.id = btoa( `${Math.random() * 0.1}`.slice( 5 ) );
	}

	/**
	 * @inheritDoc
	 */
	clone( parent: SplitArticleTemplate ): SplitArticleTemplateRow {
		return super.clone( parent ) as SplitArticleTemplateRow;
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
