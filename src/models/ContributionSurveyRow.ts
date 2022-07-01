import cloneRegex from '../util/cloneRegex';
import { ExpandedRevisionData } from '../api/ExpandedRevisionData';

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
	Missing = 4
}

/**
 *
 */
export class ContributionSurveyRowRevision {

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
		/\* ?\[\[:?(.+?)]](?:: ?)?(?:.*?(?:\[\[Special:Diff\/(\d+)\|.+?]])+|(.+$))/gm;

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
			[ ContributionSurveyRowStatus.WithViolations ]: /\{\{(aye|y)}}/g,
			[ ContributionSurveyRowStatus.WithoutViolations ]: /\{\{n(ay)?}}/g,
			[ ContributionSurveyRowStatus.Missing ]: /\{\{\?}}/g
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
	 * The title of the page that this row is attached to.
	 */
	title: mw.Title;
	/**
	 * The diffs included in this row.
	 */
	diffs?: Record<number, ContributionSurveyRowRevision>;
	/**
	 * The status of this row.
	 */
	status: ContributionSurveyRowStatus;
	/**
	 * Editor comments for this row (including signature)
	 */
	comment?: string;

	/**
	 * Create a ContributionSurveyRow object from a wikitext line from the contribution survey.
	 *
	 * Example:
	 * ```
	 * *[[:Wikipedia:Wikipedians]] (1 edit): [[Special:Diff/974376118|(+127853)]]
	 * ```
	 *
	 * @param wikitext The wikitext to parse
	 */
	static async fromWikitext( wikitext: string ): Promise<ContributionSurveyRow> {
		const rowExec = cloneRegex( ContributionSurveyRow.rowWikitextRegex ).exec( wikitext );
		const diffs = [];

		if ( rowExec[ 2 ] !== null && rowExec.length !== 0 ) {
			const diffRegex = /Special:Diff\/(\d+)/g;
			let diffMatch = diffRegex.exec( rowExec[ 0 ] );
			while ( diffMatch != null ) {
				if ( diffMatch[ 1 ] == null ) {
					console.warn( 'Could not parse revision ID: ' + diffMatch[ 0 ] );
				} else {
					diffs.push( +diffMatch[ 1 ] );
				}

				diffMatch = diffRegex.exec( rowExec[ 2 ] );
			}

			const revisionData: Record<number, ExpandedRevisionData> = {};
			const toCache = [];
			for ( const revisionID of diffs ) {
				const cachedDiff = await window.deputy.storage.db.get( 'diffCache', revisionID );
				if ( cachedDiff ) {
					revisionData[ revisionID ] = cachedDiff;
				} else {
					toCache.push( revisionID );
				}
			}
			if ( toCache.length > 0 ) {
				const expandedData = await window.deputy.api.getExpandedRevisionData( toCache );
				Object.assign(
					revisionData, expandedData
				);

				for ( const revisionID in expandedData ) {
					await window.deputy.storage.db.put(
						'diffCache', expandedData[ revisionID ]
					);
				}
			}

			return new ContributionSurveyRow(
				new mw.Title( rowExec[ 1 ] ),
				revisionData,
				ContributionSurveyRowStatus.Unfinished,
				null
			);
		} else {
			return new ContributionSurveyRow(
				new mw.Title( rowExec[ 1 ] ),
				null,
				this.identifyCommentStatus( rowExec[ 3 ] ),
				rowExec[ 3 ]
			);
		}

	}

	/**
	 * Creates a new contribution survey row from MediaWiki parser output.
	 *
	 * @param title The title of the page that this row is attached to.
	 * @param diffs The diffs included in this row.
	 * @param status The status of this row.
	 * @param comment The editor comments for this row (including signature)
	 */
	private constructor(
		title: ContributionSurveyRow['title'],
		diffs: ContributionSurveyRow['diffs'],
		status: ContributionSurveyRow['status'],
		comment: ContributionSurveyRow['comment']
	) {
		this.title = title;
		this.diffs = diffs;
		this.status = status;
		this.comment = comment;
	}

}
