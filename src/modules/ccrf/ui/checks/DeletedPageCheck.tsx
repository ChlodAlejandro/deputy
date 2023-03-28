import BackgroundCheck from './BackgroundCheck';
import { DispatchUserDeletedPagesResponse } from '../../../../api/types/DispatchTypes';
import type { DeletedPage, PageDeletionInfo } from 'deputy-dispatch/src/models/DeletedPage';
import { ChangesListDate } from '../../../../ui/shared/ChangesList';
import unwrapJQ from '../../../../util/unwrapJQ';
import msgEval from '../../../../wiki/util/msgEval';
import nsId from '../../../../wiki/util/nsId';
import { h } from 'tsx-dom';
import { DeputyDispatchTask } from '../../../../api/DispatchAsync';
import { USER_LOCALE } from '../../../../wiki/Locale';

/**
 * Renders the header for a deleted page entry
 *
 *
 * @param page
 * @param page.page
 * @return A JSX Element
 */
function DeletedPageHeader( { page }: {page: DeletedPage} ): JSX.Element {
	const pageTitle = new mw.Title( page.title, page.ns );
	return <div class="ccrf-deleted-page--header">
		<div><a href={
			mw.util.getUrl( pageTitle.getPrefixedText() )
		} target="_blank">{pageTitle.getPrefixedText()}</a></div>
		<div
			class="ccrf-deleted-page--details"
			data-separator={ mw.msg( 'deputy.ccrf.page.details.separator' )}
		><span
				class="ccrf-deleted-page--links"
				data-before={mw.msg( 'deputy.ccrf.page.links.start' )}
				data-after={mw.msg( 'deputy.ccrf.page.links.end' )}
			>
				<a href={
					mw.util.getUrl( 'Special:Log', { page: pageTitle.getPrefixedText() } )
				} data-separator={mw.msg( 'deputy.ccrf.page.links.separator' )}>{
						mw.msg( 'deputy.ccrf.page.history' )
					}</a>
			</span><span>{
				mw.msg( 'deputy.revision.bytes', `${page.length}` )
			}</span>{
				unwrapJQ(
					<span />,
					mw.message(
						'deputy.ccrf.page.details.created',
						<ChangesListDate revision={ { timestamp: page.created } } link={ false } />
					).parseDom()
				)
			}</div>
	</div>;
}

/**
 *
 * @param root0
 * @param root0.page
 * @return A JSX Element
 */
function DeletedPageReason(
	{ page }: { page: DeletedPage & { deleted: PageDeletionInfo } }
): JSX.Element {
	const time = new Date( page.deleted.timestamp );
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

	const logPage = new mw.Title( 'Special:Redirect/logid/' + page.deleted.logid )
		.getPrefixedText();
	const userPage = new mw.Title( page.deleted.user, nsId( 'user' ) )
		.getPrefixedText();

	return <ul class="ccrf-deleted-page--reason">
		{unwrapJQ(
			<li/>,
			page.deleted.userhidden ?
				mw.message( 'deputy.ccrf.page.deleted.userhidden',
					logPage,
					`${formattedTime}${comma}${formattedDate}`,
					msgEval( page.deleted.comment ).parseDom()
				).parseDom() :
				mw.message( 'deputy.ccrf.page.deleted',
					userPage,
					page.deleted.user,
					logPage,
					`${formattedTime}${comma}${formattedDate}`,
					msgEval( page.deleted.comment ).parseDom()
				).parseDom()
		)}
	</ul>;
}

/**
 * Renders a deleted page entry.
 *
 * @param root0
 * @param root0.page
 * @return A JSX Element
 */
function DeletedPagePanel(
	{ page }: { page: DeletedPage & { deleted: PageDeletionInfo } }
): JSX.Element {
	return <div class="ccrf-deleted-page">
		<DeletedPageHeader page={page} />
		<DeletedPageReason page={page} />
	</div>;
}

/**
 *
 */
export default class DeletedPageCheck
	extends BackgroundCheck<DispatchUserDeletedPagesResponse> {

	/** @inheritDoc */
	constructor(
		readonly task: DeputyDispatchTask<DispatchUserDeletedPagesResponse>
	) {
		super( 'page', task );
	}

	/**
	 * @param data
	 * @return Pages that match this specific filter
	 */
	getMatchingPages( data: DeletedPage[] ): DeletedPage[] {
		const filter = window.CCICaseRequestFiler.wikiConfig.ccrf.pageDeletionFilters.get();
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
	 * @inheritDoc
	 */
	getResultMessage( data: { pages: DeletedPage[] } ): { icon: string; message: string } {
		const pages = this.getMatchingPages( data.pages );
		return {
			icon: pages.length > 0 ? 'check' : 'close',
			message: this.msg(
				pages.length > 0 ? 'match' : 'clear', `${pages.length}`
			)
		};
	}

	/**
	 * @inheritDoc
	 */
	renderCheckResults( data: { pages: DeletedPage[] } ): JSX.Element {
		const pageElements = [];

		for ( const page of this.getMatchingPages( data.pages ) ) {
			pageElements.push(
				<DeletedPagePanel page={page as DeletedPage & { deleted: PageDeletionInfo }} />
			);
			// Ignore all deletions which don't match our conditions.
		}
		if ( pageElements.length === 0 ) {
			return <div>{this.msg( 'none' )}</div>;
		}
		return <div>{pageElements}</div>;
	}

}
