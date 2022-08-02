/**
 * Copied template rows as strings.
 */
import BackwardsCopy from './BackwardsCopy';
import BackwardsCopyRowPage from '../../ui/pages/BackwardsCopyRowPage';
import { AttributionNoticeRow } from '../AttributionNoticeRow';

/**
 * Represents a row in the {{copied}} template. These should represent
 * their actual values instead of raw parameters from the template.
 */
export interface RawBackwardsCopyRow {
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
	 * The month day of publishing for this publication.
	 */
	monthday?: string;
}

export type BackwardsCopyRowParameter = typeof backwardsCopyRowParameters[number];
export const backwardsCopyRowParameters = <const>[
	'articlename', 'title', 'year', 'author', 'authorlist',
	'display_authors', 'url', 'org', 'monthday'
];

/**
 * Checks if a given string key is a valid {{copied}} template row parameter.
 *
 * @param key
 * @return `true` if a string is a {{copied}} template row parameter.
 */
export function isBackwardsCopyRowParameter( key: string ): key is BackwardsCopyRowParameter {
	return ( backwardsCopyRowParameters as readonly string[] ).indexOf( key ) !== -1;
}

/**
 * Represents a row/entry in a {{copied}} template.
 */
export default class BackwardsCopyRow
	extends AttributionNoticeRow<BackwardsCopy> implements RawBackwardsCopyRow {

	id: string;
	/** @inheritDoc */
	articlename?: string;
	/** @inheritDoc */
	title?: string;
	/** @inheritDoc */
	year?: string;
	/** @inheritDoc */
	author?: string;
	/** @inheritDoc */
	authorlist?: string;
	/** @inheritDoc */
	// eslint-disable-next-line camelcase
	display_authors?: string;
	/** @inheritDoc */
	url?: string;
	/** @inheritDoc */
	org?: string;
	/** @inheritDoc */
	monthday?: string;

	// noinspection JSDeprecatedSymbols
	/**
	 * Creates a new RawBackwardsCopyRow
	 *
	 * @param rowObjects
	 * @param parent
	 */
	constructor( rowObjects: RawBackwardsCopyRow, parent: BackwardsCopy ) {
		super();
		// this.from = rowObjects.from;
		// // eslint-disable-next-line camelcase
		// this.from_oldid = rowObjects.from_oldid;
		// this.to = rowObjects.to;
		// // eslint-disable-next-line camelcase
		// this.to_diff = rowObjects.to_diff;
		// // eslint-disable-next-line camelcase
		// this.to_oldid = rowObjects.to_oldid;
		// this.diff = rowObjects.diff;
		// this.date = rowObjects.date;
		// this.afd = rowObjects.afd;
		// this.merge = rowObjects.merge;
		//
		// // Clean all zero-length parameters.
		// for ( const param of backwardsCopyRowParameters ) {
		//     if ( this[ param ] && this[ param ].trim && this[ param ].trim().length === 0 ) {
		//         delete this[ param ];
		//     }
		// }

		this._parent = parent;
		this.id = btoa( `${Math.random() * 0.1}`.slice( 5 ) );
	}

	/**
	 * @inheritDoc
	 */
	clone( parent: BackwardsCopy ): BackwardsCopyRow {
		return super.clone( parent ) as BackwardsCopyRow;
	}

	/**
	 * @inheritDoc
	 */
	generatePage( dialog: any ): ReturnType<typeof BackwardsCopyRowPage> {
		return BackwardsCopyRowPage( {
			backwardsCopyRow: this,
			parent: dialog
		} );
	}

}
