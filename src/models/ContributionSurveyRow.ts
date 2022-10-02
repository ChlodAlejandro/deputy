import cloneRegex from '../util/cloneRegex';
import { ContributionSurveyRevision } from './ContributionSurveyRevision';
import DeputyCasePage from '../wiki/DeputyCasePage';
import MwApi from '../MwApi';

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

	/**
	 * Wikitext for checking if a given row is a contribution survey row.
	 * $1 is the page name. $2 is the ID of the first revision. If $2 is undefined, the
	 * page has been cleared and commented on by a user.
	 */
	static readonly rowWikitextRegex =
		/\*?(?:'''.''' )?\[\[:?(.+?)]] ?([^:]*) ?(?:: ?)?(?:(?:\[\[Special:Diff\/(\d+)\|.+?]])+|(.+$))/gm;

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
	 * Determines if a given wikitext line is a valid contribution survey row.
	 *
	 * @param text The wikitext to check
	 * @return Whether the provided wikitext is a contribution survey row or not
	 */
	static isContributionSurveyRowText( text: string ): boolean {
		return cloneRegex( ContributionSurveyRow.rowWikitextRegex ).test( text );
	}

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
	 * The diffs included in this row.
	 */
	private diffs?: Map<number, ContributionSurveyRevision>;

	/**
	 * Creates a new contribution survey row from MediaWiki parser output.
	 *
	 * @param casePage The case page of this row
	 * @param wikitext The wikitext of the row
	 */
	constructor( casePage: DeputyCasePage, wikitext: string ) {
		const rowExec = cloneRegex( ContributionSurveyRow.rowWikitextRegex ).exec( wikitext );

		this.casePage = casePage;
		this.wikitext = wikitext;
		this.title = new mw.Title( rowExec[ 1 ] );
		this.extras = rowExec[ 2 ];
		this.comment = rowExec[ 4 ];
		this.status = this.originalStatus = rowExec[ 4 ] == null ?
			ContributionSurveyRowStatus.Unfinished :
			ContributionSurveyRow.identifyCommentStatus( rowExec[ 4 ] );

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

		const rowExec = cloneRegex( ContributionSurveyRow.rowWikitextRegex ).exec( this.wikitext );
		const revisionData: Map<number, ContributionSurveyRevision> = new Map();
		const diffs = [];

		// Load revision information
		if ( rowExec[ 3 ] !== null && rowExec.length !== 0 ) {
			const diffRegex = cloneRegex( /Special:Diff\/(\d+)/g );
			let diffMatch = diffRegex.exec( rowExec[ 0 ] );
			while ( diffMatch != null ) {
				if ( diffMatch[ 1 ] == null ) {
					console.warn( 'Could not parse revision ID: ' + diffMatch[ 0 ] );
				} else {
					diffs.push( +diffMatch[ 1 ] );
				}

				diffMatch = diffRegex.exec( rowExec[ 0 ] );
			}

			const toCache = [];
			for ( const revisionID of diffs ) {
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
				const expandedData = await window.deputy.api.getExpandedRevisionData( toCache );
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
		}

		// Load tag messages
		const tags = Array.from( revisionData.values() ).reduce<string[]>( ( acc, cur ) => {
			for ( const tag of cur.tags ) {
				if ( acc.indexOf( tag ) === -1 ) {
					acc.push( tag );
				}
			}
			return acc;
		}, [ 'list-wrapper' ] );
		await MwApi.action.loadMessagesIfMissing(
			tags.map( ( v ) => 'tag-' + v ), {
				amenableparser: true
			}
		);

		// Sort from most bytes to least.
		return this.diffs = new Map( [ ...revisionData.entries() ].sort(
			( a, b ) => b[ 1 ].diffsize - a[ 1 ].diffsize
		) );
	}

	/**
	 * Gets the comment with status indicator removed.
	 *
	 * @return The comment with the status indicator removed.
	 */
	getActualComment() {
		if ( this.originalStatus === ContributionSurveyRowStatus.Unfinished ) {
			return '';
		} else if ( this.statusIsolated === false ||
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
	}

}
