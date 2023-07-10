import cloneRegex from '../util/cloneRegex';
import { ContributionSurveyRevision } from './ContributionSurveyRevision';
import DeputyCasePage from '../wiki/DeputyCasePage';
import MwApi from '../MwApi';
import ContributionSurveyRowParser, {
	RawContributionSurveyRow
} from './ContributionSurveyRowParser';
import { ContributionSurveyRowSort } from './ContributionSurveyRowSort';

export enum ContributionSurveyRowStatus {
	// The row has not been processed yet.
	Unfinished = 0,
	// The row has a comment but cannot be parsed
	Unknown = 1,
	// The row has been processed and violations were found ({{y}})
	WithViolations = 2,
	// The row has been processed and violations were not found ({{n}})
	WithoutViolations = 3,
	// The row has been found but the added text is no longer in the existing revision
	Missing = 4,
	// The row has been processed and text was presumptively removed ({{x}}),
	PresumptiveRemoval = 5
}

/**
 * Represents a contribution survey row. This is an abstraction of the row that can
 * be seen on contribution survey pages, which acts as an intermediate between raw
 * wikitext and actual HTML content.
 */
export default class ContributionSurveyRow {

	static readonly Parser = ContributionSurveyRowParser;

	/**
	 * A set of regular expressions that will match a specific contribution survey row
	 * comment. Used to determine the status of the comment.
	 */
	static readonly commentMatchRegex : Record<
		Exclude<
			ContributionSurveyRowStatus,
			ContributionSurveyRowStatus.Unfinished | ContributionSurveyRowStatus.Unknown
		>,
		RegExp
	> = {
			// TODO: Wiki localization
			[ ContributionSurveyRowStatus.WithViolations ]: /\{\{(aye|y)}}/gi,
			[ ContributionSurveyRowStatus.WithoutViolations ]: /\{\{n(ay)?}}/gi,
			[ ContributionSurveyRowStatus.Missing ]: /\{\{\?}}/gi,
			[ ContributionSurveyRowStatus.PresumptiveRemoval ]: /\{\{x}}/gi
		};

	/**
	 * Identifies a row's current status based on the comment's contents.
	 *
	 * @param comment The comment to process
	 * @return The status of the row
	 */
	static identifyCommentStatus( comment: string )
		: Exclude<ContributionSurveyRowStatus, ContributionSurveyRowStatus.Unfinished> {
		for ( const status in ContributionSurveyRow.commentMatchRegex ) {
			if ( cloneRegex(
				ContributionSurveyRow.commentMatchRegex[
					+status as keyof ( typeof ContributionSurveyRow )['commentMatchRegex']
				]
			).test( comment ) ) {
				return +status as keyof ( typeof ContributionSurveyRow )['commentMatchRegex'];
			}
		}
		return ContributionSurveyRowStatus.Unknown;
	}

	/**
	 * Guesses the sort order for a given set of revisions.
	 *
	 * @param diffs The diffs to guess from.
	 * @return The sort order
	 */
	static guessSortOrder(
		diffs: Iterable<ContributionSurveyRevision>
	): ContributionSurveyRowSort {
		let last: ContributionSurveyRevision = null;
		let dateScore = 1;
		let dateReverseScore = 1;
		let byteScore = 1;
		for ( const diff of diffs ) {
			if ( last == null ) {
				last = diff;
			} else {
				const diffTimestamp = new Date( diff.timestamp ).getTime();
				const lastTimestamp = new Date( last.timestamp ).getTime();
				dateScore = ( dateScore + (
					diffTimestamp > lastTimestamp ? 1 : 0
				) ) / 2;
				dateReverseScore = ( dateReverseScore + (
					diffTimestamp < lastTimestamp ? 1 : 0
				) ) / 2;
				byteScore = ( byteScore + (
					diff.diffsize < last.diffsize ? 1 : 0
				) ) / 2;
				last = diff;
			}
		}

		// Multiply by weights to remove ties
		dateScore *= 1.1;
		dateReverseScore *= 1.05;

		switch ( Math.max( dateScore, dateReverseScore, byteScore ) ) {
			case byteScore:
				return ContributionSurveyRowSort.Bytes;
			case dateScore:
				return ContributionSurveyRowSort.Date;
			case dateReverseScore:
				return ContributionSurveyRowSort.DateReverse;
		}
	}

	/**
	 * Gets the sorter function which will sort a set of diffs based on a given
	 * sort order. This sorts any array containing revisions.
	 *
	 * @param sort
	 * @param mode The sort mode to use.
	 */
	static getSorterFunction( sort: ContributionSurveyRowSort, mode?: 'array' ):
		( a: ContributionSurveyRevision, b: ContributionSurveyRevision ) => number;
	/**
	 * Gets the sorter function which will sort a set of diffs based on a given
	 * sort order. This sorts any entry array using the first element (the key).
	 *
	 * @param sort
	 * @param mode The sort mode to use.
	 */
	static getSorterFunction( sort: ContributionSurveyRowSort, mode?: 'key' ):
		( a: [ContributionSurveyRevision, any], b: [ContributionSurveyRevision, any] ) => number;
	/**
	 * Gets the sorter function which will sort a set of diffs based on a given
	 * sort order. This sorts any entry array using the second element (the value).
	 *
	 * @param sort
	 * @param mode The sort mode to use.
	 */
	static getSorterFunction( sort: ContributionSurveyRowSort, mode?: 'value' ):
		( a: [any, ContributionSurveyRevision], b: [any, ContributionSurveyRevision] ) => number;
	/**
	 * Gets the sorter function which will sort a set of diffs based on a given
	 * sort order.
	 *
	 * @param sort
	 * @param mode The sort mode to use. If `array`, the returned function sorts an
	 * array of revisions. If `key`, the returned function sorts entries with the first
	 * entry element (`entry[0]`) being a revision. If `value`, the returned function
	 * sorts values with the second entry element (`entry[1]`) being a revision.
	 * @return The sorted array
	 */
	static getSorterFunction(
		sort: ContributionSurveyRowSort,
		mode: 'array' | 'key' | 'value' = 'array'
	) {
		return ( _a: any, _b: any ) => {
			let a: ContributionSurveyRevision, b: ContributionSurveyRevision;
			switch ( mode ) {
				case 'array':
					a = _a;
					b = _b;
					break;
				case 'key':
					a = _a[ 0 ];
					b = _b[ 0 ];
					break;
				case 'value':
					a = _a[ 1 ];
					b = _b[ 1 ];
					break;
			}

			switch ( sort ) {
				case ContributionSurveyRowSort.Date:
					return new Date( a.timestamp ).getTime() - new Date( b.timestamp ).getTime();
				case ContributionSurveyRowSort.DateReverse:
					return new Date( b.timestamp ).getTime() - new Date( a.timestamp ).getTime();
				case ContributionSurveyRowSort.Bytes:
					return b.diffsize - a.diffsize;
			}
		};
	}

	/**
	 * The case page of this row.
	 */
	casePage: DeputyCasePage;
	/**
	 * The original wikitext of the row.
	 */
	wikitext: string;
	/**
	 * The title of the page that this row is attached to.
	 */
	title: mw.Title;
	/**
	 * Extra page information. e.g. "(1 edit, 1 major, +173)"
	 */
	extras: string;
	/**
	 * Editor comments for this row (including signature)
	 */
	comment?: string;
	/**
	 * Determines if the status indicator (as tested by the regular expressions at
	 * {@link ContributionSurveyRow.commentMatchRegex}) is isolated (at the start
	 * or end of the comment). This will enable removal of the status indicator
	 * from the comment in the comment text input box.
	 */
	statusIsolated?: false | 'start' | 'end';
	/**
	 * The status of this row.
	 */
	status: ContributionSurveyRowStatus;
	/**
	 * The original status of this row (if it had a prior status).
	 */
	readonly originalStatus: ContributionSurveyRowStatus;

	/**
	 * This variable returns true when
	 * (a) the row has a non-unfinished status, and
	 * (b) there are no outstanding diffs in this row
	 *
	 * @return See description.
	 */
	get completed(): boolean {
		if ( this.diffs == null ) {
			throw new Error( 'Diffs have not been pulled yet' );
		}

		return this.status !== ContributionSurveyRowStatus.Unfinished &&
			this.diffs.size === 0;
	}

	/**
	 * The diffs included in this row. Mapped by revision IDs.
	 */
	private diffs?: Map<number, ContributionSurveyRevision>;

	/**
	 * Data returned by the ContributionSurveyRowParser. Run on the wikitext
	 * during instantiation.
	 *
	 * @private
	 */
	readonly data: RawContributionSurveyRow;

	/**
	 * Creates a new contribution survey row from MediaWiki parser output.
	 *
	 * @param casePage The case page of this row
	 * @param wikitext The wikitext of the row
	 */
	constructor( casePage: DeputyCasePage, wikitext: string ) {
		this.data = new ContributionSurveyRowParser( wikitext ).parse();

		this.casePage = casePage;
		this.wikitext = wikitext;
		this.title = new mw.Title( this.data.page );
		this.extras = this.data.extras;
		this.comment = this.data.comments;
		this.status = this.originalStatus = this.data.comments == null ?
			ContributionSurveyRowStatus.Unfinished :
			ContributionSurveyRow.identifyCommentStatus( this.data.comments );

		if ( ( ContributionSurveyRow.commentMatchRegex as any )[ this.status ] != null ) {
			if (
				cloneRegex( ( ContributionSurveyRow.commentMatchRegex )[
					this.status as keyof typeof ContributionSurveyRow.commentMatchRegex
				], { pre: '^' } ).test( this.comment )
			) {
				this.statusIsolated = 'start';
			} else if (
				cloneRegex( ( ContributionSurveyRow.commentMatchRegex )[
					this.status as keyof typeof ContributionSurveyRow.commentMatchRegex
				], { post: '$' } ).test( this.comment )
			) {
				this.statusIsolated = 'end';
			} else {
				this.statusIsolated = false;
			}
		}
	}

	/**
	 * Get the ContributionSurveyRowRevisions of this row.
	 *
	 * @param forceReload
	 */
	async getDiffs( forceReload = false ): Promise<ContributionSurveyRow['diffs']> {
		if ( this.diffs != null && !forceReload ) {
			return this.diffs;
		}

		const revisionData: Map<number, ContributionSurveyRevision> = new Map();
		const revids = this.data.revids;

		// Load revision information
		const toCache = [];
		for ( const revisionID of revids ) {
			const cachedDiff = await window.deputy.storage.db.get( 'diffCache', revisionID );
			if ( cachedDiff ) {
				revisionData.set(
					revisionID, new ContributionSurveyRevision( this, cachedDiff )
				);
			} else {
				toCache.push( revisionID );
			}
		}
		if ( toCache.length > 0 ) {
			const expandedData = await window.deputy.dispatch.getExpandedRevisionData( toCache );
			for ( const revisionID in expandedData ) {
				revisionData.set(
					+revisionID,
					new ContributionSurveyRevision( this, expandedData[ revisionID ] )
				);
			}

			for ( const revisionID in expandedData ) {
				await window.deputy.storage.db.put(
					'diffCache', expandedData[ revisionID ]
				);
			}
		}

		// Load tag messages
		// First gather all tags mentioned, and then load messages.
		const tags = Array.from( revisionData.values() ).reduce<string[]>( ( acc, cur ) => {
			if ( cur.tags ) {
				for ( const tag of cur.tags ) {
					if ( acc.indexOf( tag ) === -1 ) {
						acc.push( tag );
					}
				}
			}
			return acc;
		}, [ 'list-wrapper' ] );
		await MwApi.action.loadMessagesIfMissing(
			tags.map( ( v ) => 'tag-' + v ), {
				amenableparser: true
			}
		);

		const sortOrder = ContributionSurveyRow.guessSortOrder( revisionData.values() );
		// Sort from most bytes to least.
		return this.diffs = new Map( [ ...revisionData.entries() ].sort(
			ContributionSurveyRow.getSorterFunction( sortOrder, 'value' )
		) );
	}

	/**
	 * Gets the comment with status indicator removed.
	 *
	 * @return The comment with the status indicator removed.
	 */
	getActualComment(): string {
		if ( this.originalStatus === ContributionSurveyRowStatus.Unfinished ) {
			return '';
		} else if (
			this.statusIsolated === false ||
			this.originalStatus === ContributionSurveyRowStatus.Unknown
		) {
			return this.comment;
		} else if ( this.statusIsolated === 'start' ) {
			return this.comment.replace(
				cloneRegex( ( ContributionSurveyRow.commentMatchRegex )[
					this.originalStatus as keyof typeof ContributionSurveyRow.commentMatchRegex
				], { pre: '^' } ),
				''
			).trim();
		} else if ( this.statusIsolated === 'end' ) {
			return this.comment.replace(
				cloneRegex( ( ContributionSurveyRow.commentMatchRegex )[
					this.originalStatus as keyof typeof ContributionSurveyRow.commentMatchRegex
				], { post: '$' } ),
				''
			).trim();
		}
		return '';
	}

}
