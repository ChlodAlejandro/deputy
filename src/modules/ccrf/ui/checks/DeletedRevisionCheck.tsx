import BackgroundCheck from './BackgroundCheck';
import { DispatchUserDeletedRevisionsResponse } from '../../../../api/types/DispatchTypes';
import {
	DeletedRevision,
	RevisionDeletionInfo,
	TextDeletedRevision
} from 'deputy-dispatch/src/models/DeletedRevision';
import { ChangesListRow } from '../../../../ui/shared/ChangesList';
import { DeputyDispatchTask } from '../../../../api/DispatchAsync';
import { h } from 'tsx-dom';
import MwApi from '../../../../MwApi';
import { USER_LOCALE } from '../../../../wiki/Locale';
import nsId from '../../../../wiki/util/nsId';
import unwrapJQ from '../../../../util/unwrapJQ';
import msgEval from '../../../../wiki/util/msgEval';
import classMix from '../../../../util/classMix';

/**
 * Renders the header for a deleted page entry
 *
 *
 * @param root0
 * @param root0.revision
 * @return A JSX Element
 */
function DeletedRevisionHeader( { revision }: {revision: DeletedRevision} ): JSX.Element {
	return <div class="ccrf-deleted-revision--header">
		<ChangesListRow revision={Object.assign( revision )} format="contribs" />
	</div>;
}

/**
 *
 * @param root0
 * @param root0.revision
 * @return A JSX Element
 */
function DeletedRevisionReason(
	{ revision }: { revision: DeletedRevision & { deleted: RevisionDeletionInfo } }
): JSX.Element {
	const time = new Date( revision.deleted.timestamp );
	const now = window.moment( time );

	const formattedTime = time.toLocaleTimeString( USER_LOCALE, {
		hourCycle: 'h24',
		timeStyle: mw.user.options.get( 'date' ) === 'ISO 8601' ? 'long' : 'short'
	} );
	const formattedDate = now.locale( USER_LOCALE ).format( {
		dmy: 'D MMMM YYYY',
		mdy: 'MMMM D, Y',
		ymd: 'YYYY MMMM D',
		'ISO 8601': 'YYYY:MM:DD[T]HH:mm:SS'
	}[ mw.user.options.get( 'date' ) as string ] );

	const comma = mw.msg( 'comma-separator' );

	const logPage = new mw.Title( 'Special:Redirect/logid/' + revision.deleted.logid )
		.getPrefixedText();
	const userPage = new mw.Title( revision.deleted.user, nsId( 'user' ) )
		.getPrefixedText();

	return <ul class="ccrf-deleted-revision--reason">
		{unwrapJQ(
			<li/>,
			revision.deleted.userhidden ?
				mw.message( 'deputy.ccrf.page.deleted.userhidden',
					logPage,
					`${formattedTime}${comma}${formattedDate}`,
					msgEval( revision.deleted.comment ).parseDom()
				).parseDom() :
				mw.message( 'deputy.ccrf.page.deleted',
					userPage,
					revision.deleted.user,
					logPage,
					`${formattedTime}${comma}${formattedDate}`,
					msgEval( revision.deleted.comment ).parseDom()
				).parseDom()
		)}
		{ ( revision as TextDeletedRevision ).islikelycause && <li>
			{ mw.msg( 'deputy.ccrf.revision.likely' ) }
		</li> }
	</ul>;
}

/**
 * Renders a deleted revision entry.
 *
 * @param root0
 * @param root0.revision
 * @return A JSX Element
 */
function DeletedRevisionPanel(
	{ revision }: { revision: DeletedRevision & { deleted: RevisionDeletionInfo } }
): JSX.Element {
	return <div class={classMix(
		'ccrf-deleted-revision',
		( revision as TextDeletedRevision ).islikelycause && 'ccrf-deleted-revision--likely'
	)}>
		<DeletedRevisionHeader revision={revision} />
		<DeletedRevisionReason revision={revision} />
	</div>;
}

/**
 *
 */
export default class DeletedRevisionCheck
	extends BackgroundCheck<DispatchUserDeletedRevisionsResponse> {

	/** @inheritDoc */
	constructor(
		readonly task: DeputyDispatchTask<DispatchUserDeletedRevisionsResponse>
	) {
		super( 'revision', task );
	}

	/**
	 * @param data
	 * @return Pages that match this specific filter
	 */
	getMatchingRevisions( data: DeletedRevision[] ): DeletedRevision[] {
		const filter = window.CCICaseRequestFiler.wikiConfig.ccrf.revisionDeletionFilters.get();
		const isMatching = typeof filter === 'string' ?
			( comment: string ) => comment.includes( filter ) :
			( Array.isArray( filter ) ?
				( comment: string ) => filter.some( ( f ) => comment.includes( f ) ) :
				( comment: string ) => new RegExp( filter.source, filter.flags ).test( comment )
			);

		return data.filter( ( revision ) =>
			typeof revision.deleted === 'object' &&
			revision.deleted.comment &&
			isMatching( revision.deleted.comment ) );
	}

	/**
	 * @inheritDoc
	 */
	getResultMessage( data: { revisions: DeletedRevision[] } ): { icon: string; message: string } {
		const revisions = this.getMatchingRevisions( data.revisions );
		const closeRevisions = revisions
			.filter( r => ( r as TextDeletedRevision ).islikelycause === true ).length;
		return {
			icon: revisions.length > 0 ? 'check' : 'close',
			message: this.msg(
				revisions.length > 0 ? (
					closeRevisions > 0 ? 'match.close' : 'match'
				) : 'clear',
				revisions.length,
				closeRevisions
			)
		};
	}

	/**
	 * @inheritDoc
	 */
	async renderCheckResults( data: { revisions: DeletedRevision[] } ): Promise<JSX.Element> {
		const revisionElements = [];

		const matchingRevisions = this.getMatchingRevisions( data.revisions );

		// Grab tags
		const tags = Array.from( matchingRevisions.values() )
			.reduce<string[]>( ( acc, cur ) => {
				for ( const tag of cur.tags ) {
					if ( acc.indexOf( tag ) === -1 ) {
						acc.push( tag );
					}
				}
				return acc;
			}, [ 'list-wrapper', 'comma-separator' ] );
		await MwApi.action.loadMessagesIfMissing(
			tags.map( ( v ) => 'tag-' + v ), {
				amenableparser: true
			}
		);

		// Sort from newest to oldest (to prepare for below)
		matchingRevisions.sort(
			// FIXME: Wasteful; numerous ephemeral Date object creation
			( a, b ) =>
				new Date( b.timestamp ).getTime() - new Date( a.timestamp ).getTime()
		);
		// Date headers
		const intervals = [
			1e3 * 60 * 60 * 24 * 7, // Past week
			1e3 * 60 * 60 * 24 * 30, // Past month
			1e3 * 60 * 60 * 24 * 30 * 3, // Past 3 months
			1e3 * 60 * 60 * 24 * 365 // Past year
		];
		let lastInterval = null;

		const now = Date.now();
		for ( const revision of matchingRevisions ) {
			const revisionTimestamp = new Date( revision.timestamp ).getTime();
			const closestInterval =
				intervals.find( ( interval ) => now - revisionTimestamp < interval );
			if ( closestInterval !== lastInterval ) {
				revisionElements.push(
					<div class="ccrf-deleted-revision--interval">
						{window.moment( now - revisionTimestamp ).fromNow()}
					</div>
				);
				lastInterval = closestInterval;
			}

			revisionElements.push(
				<DeletedRevisionPanel
					revision={revision as DeletedRevision & { deleted: RevisionDeletionInfo }}
				/>
			);
			// Ignore all deletions which don't match our conditions.
		}
		if ( revisionElements.length === 0 ) {
			return <div>{this.msg( 'none' )}</div>;
		}
		return <div>{revisionElements}</div>;
	}

}
