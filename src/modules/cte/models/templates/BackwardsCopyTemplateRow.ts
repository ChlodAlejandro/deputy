/**
 * Copied template rows as strings.
 */
import BackwardsCopyTemplate from './BackwardsCopyTemplate';
import BackwardsCopyTemplateRowPage from '../../ui/pages/BackwardsCopyTemplateRowPage';
import { AttributionNoticeRow } from '../AttributionNoticeRow';

/**
 * Represents a row in the {{copied}} template. These should represent
 * their actual values instead of raw parameters from the template.
 */
export interface RawBackwardsCopyTemplateRow {
	/**
	 * Alias of `title`.
	 */
	articlename?: string;
	/**
	 * The name of the article published.
	 */
	title?: string;
	/**
	 * The year of publication for this publication.
	 */
	year?: string;
	/**
	 * Used to input an author.
	 */
	author?: string;
	/**
	 * Used to input a list of authors, usually separated by a semicolon.  Overrides `author`.
	 */
	authorlist?: string;
	/**
	 * Whether to display authors or not.
	 */
	display_authors?: string;
	/**
	 * The URL of the publication.
	 */
	url?: string;
	/**
	 * The publisher of the publication.
	 */
	org?: string;
	/**
	 * The date of publishing for this publication.
	 */
	date?: string;
	/**
	 * The month and day of publishing for this publication.
	 */
	monthday?: string;
}

export const backwardsCopyTemplateRowParameters = <const>[
	'title', 'year', 'author', 'authorlist',
	'display_authors', 'url', 'org', 'monthday',
	'articlename', 'date'
];
export type BackwardsCopyTemplateRowParameter = typeof backwardsCopyTemplateRowParameters[number];

/**
 * Checks if a given string key is a valid {{copied}} template row parameter.
 *
 * @param key
 * @return `true` if a string is a {{copied}} template row parameter.
 */
export function isBackwardsCopyRowParameter(
	key: string
): key is BackwardsCopyTemplateRowParameter {
	return ( backwardsCopyTemplateRowParameters as readonly string[] ).indexOf( key ) !== -1;
}

/**
 * Represents a row/entry in a {{copied}} template.
 */
export default class BackwardsCopyTemplateRow
	extends AttributionNoticeRow<BackwardsCopyTemplate>
	implements RawBackwardsCopyTemplateRow {

	id: string;

	/** @inheritdoc */
	articlename?: string;
	/** @inheritdoc */
	title?: string;
	/** @inheritdoc */
	year?: string;
	/** @inheritdoc */
	author?: string;
	/** @inheritdoc */
	authorlist?: string;
	/** @inheritdoc */
	// eslint-disable-next-line camelcase
	display_authors?: string;
	/** @inheritdoc */
	url?: string;
	/** @inheritdoc */
	org?: string;
	/** @inheritdoc */
	date?: string;
	/** @inheritdoc */
	monthday?: string;

	// noinspection JSDeprecatedSymbols
	/**
	 * Creates a new RawBackwardsCopyRow
	 *
	 * @param rowObjects
	 * @param parent
	 */
	constructor( rowObjects: RawBackwardsCopyTemplateRow, parent: BackwardsCopyTemplate ) {
		super( parent );

		this.articlename = rowObjects.articlename;
		this.title = rowObjects.title;
		this.year = rowObjects.year;
		this.author = rowObjects.author;
		this.authorlist = rowObjects.authorlist;
		// eslint-disable-next-line camelcase
		this.display_authors = rowObjects.display_authors;
		this.url = rowObjects.url;
		this.org = rowObjects.org;
		this.date = rowObjects.date;
		this.monthday = rowObjects.monthday;
	}

	/**
	 * @inheritDoc
	 */
	clone( parent: BackwardsCopyTemplate ): BackwardsCopyTemplateRow {
		return super.clone( parent ) as BackwardsCopyTemplateRow;
	}

	/**
	 * @inheritDoc
	 */
	generatePage( dialog: any ): ReturnType<typeof BackwardsCopyTemplateRowPage> {
		return BackwardsCopyTemplateRowPage( {
			backwardsCopyTemplateRow: this,
			parent: dialog
		} );
	}

}
