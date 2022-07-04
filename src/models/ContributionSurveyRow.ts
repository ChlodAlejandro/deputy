import cloneRegex from '../util/cloneRegex';
import { ContributionSurveyRevision } from './ContributionSurveyRevision';

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
	 * The original wikitext of the row.
	 */
	wikitext: string;
	/**
	 * The title of the page that this row is attached to.
	 */
	title: mw.Title;
	/**
	 * Editor comments for this row (including signature)
	 */
	comment?: string;
	/**
	 * The status of this row.
	 */
	status: ContributionSurveyRowStatus;

	/**
	 * The diffs included in this row.
	 */
	private diffs?: Map<number, ContributionSurveyRevision>;

	/**
	 * Creates a new contribution survey row from MediaWiki parser output.
	 *
	 * @param wikitext The wikitext of the row
	 */
	constructor( wikitext: string ) {
		const rowExec = cloneRegex( ContributionSurveyRow.rowWikitextRegex ).exec( wikitext );

		this.wikitext = wikitext;
		this.title = new mw.Title( rowExec[ 1 ] );
		this.comment = rowExec[ 3 ];
		this.status = rowExec[ 3 ] == null ?
			ContributionSurveyRowStatus.Unfinished :
			ContributionSurveyRow.identifyCommentStatus( rowExec[ 3 ] );
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
		if ( rowExec[ 2 ] !== null && rowExec.length !== 0 ) {
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
		}, [] );
		await window.deputy.wiki.loadMessagesIfMissing(
			tags.map( ( v ) => 'tag-' + v )
		);

		return this.diffs = revisionData;
	}

}
