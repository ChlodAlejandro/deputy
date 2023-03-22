// noinspection ES6UnusedImports
import type CCICaseRequestFiler from '../../CCICaseRequestFiler';
import BackgroundCheck from './BackgroundCheck';
import { DispatchUserDeletedRevisionsResponse } from '../../../../api/types/DispatchTypes';
import { DeletedRevision } from 'deputy-dispatch/src/models/DeletedRevision';
import { ChangesListDate, ChangesListRow } from '../../../../ui/shared/ChangesList';
import unwrapJQ from '../../../../util/unwrapJQ';
import msgEval from '../../../../wiki/util/msgEval';
import nsId from '../../../../wiki/util/nsId';
import { DeputyDispatchTask } from '../../../../api/DispatchAsync';
import { h } from 'tsx-dom';

/**
 * Renders the header for a deleted page entry
 *
 *
 * @param page
 * @param page.page
 * @param page.revision
 * @return A JSX Element
 */
function DeletedRevisionHeader( { revision }: {revision: DeletedRevision} ): JSX.Element {
	return <div class="ccrf-deleted-page--header">
		<ChangesListRow revision={this.revision} />
	</div>;
}

/**
 *
 * @param root0
 * @param root0.page
 * @param root0.revision
 */
function DeletedRevisionReason(
	{ revision }: { revision: DeletedRevision }
): JSX.Element {
	// TODO
}

/**
 * Renders a deleted page entry.
 *
 * @param root0
 * @param root0.page
 * @param root0.revision
 * @return A JSX Element
 */
function DeletedRevisionPanel(
	{ revision }: { revision: DeletedRevision }
): JSX.Element {
	return <div class="ccrf-deleted-page">
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
		super( 'page', task );
	}

	/**
	 * @param data
	 * @return Pages that match this specific filter
	 */
	getMatchingPages( data: DeletedRevision[] ): DeletedRevision[] {
		const filter = window.CCICaseRequestFiler.wikiConfig.ccrf.revisionDeletionFilters.get();
		const isMatching = typeof filter === 'string' ?
			( comment: string ) => comment.includes( filter ) :
			( Array.isArray( filter ) ?
				( comment: string ) => filter.some( ( f ) => comment.includes( f ) ) :
				( comment: string ) => new RegExp( filter.source, filter.flags ).test( comment )
			);

		return data.filter( ( page ) =>
			typeof page.deleted === 'object' &&
			page.deleted.comment &&
			isMatching( page.deleted.comment ) );
	}

	/**
	 *
	 * @param data
	 * @param data.revisions
	 */
	getResultMessage( data: { revisions: DeletedRevision[] } ): { icon: string; message: string } {
		const revisions = this.getMatchingPages( data.revisions );
		return {
			icon: revisions.length > 0 ? 'check' : 'close',
			message: this.msg(
				revisions.length > 0 ? 'match' : 'clear', `${revisions.length}`
			)
		};
	}

	/**
	 * @param data
	 * @param data.pages
	 * @param data.revisions
	 * @return Rendered check results.
	 */
	renderCheckResults( data: { revisions: DeletedRevision[] } ): JSX.Element {
		const pageElements = [];

		for ( const revision of this.getMatchingPages( data.revisions ) ) {
			pageElements.push(
				<DeletedRevisionPanel revision={revision as DeletedRevision} />
			);
			// Ignore all deletions which don't match our conditions.
		}
		return <div>{pageElements}</div>;
	}

}
