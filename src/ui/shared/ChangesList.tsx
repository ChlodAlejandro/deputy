import '../../types';
import getRevisionURL from '../../wiki/util/getRevisionURL';
import getRevisionDiffURL from '../../wiki/util/getRevisionDiffURL';
import nsId from '../../wiki/util/nsId';
import type { ExpandedRevisionData } from '../../api/ExpandedRevisionData';
import { ComponentChild, h } from 'tsx-dom';
import unwrapJQ from '../../util/unwrapJQ';
import msgEval from '../../wiki/util/msgEval';
import classMix from '../../util/classMix';
import { USER_LOCALE } from '../../wiki/Locale';

/**
 * @param root0
 * @param root0.revid
 * @param root0.parentid
 * @param root0.missing
 * @return HTML element
 */
export function ChangesListLinks(
	{ revid: _revid, parentid: _parentid, missing }:
		{ revid: number, parentid: number, missing?: boolean }
): JSX.Element {
	const cur = getRevisionDiffURL( _revid, 'cur' );
	const prev = missing ?
		getRevisionDiffURL( _revid, 'prev' ) :
		getRevisionDiffURL( _parentid, _revid );

	let cv;
	if (
		window.deputy &&
		window.deputy.config.cci.showCvLink &&
		window.deputy.wikiConfig.cci.earwigRoot
	) {
		cv = new URL( '', window.deputy.wikiConfig.cci.earwigRoot.get() );
		const selfUrl = new URL( window.location.href );
		const urlSplit = selfUrl.hostname.split( '.' ).reverse();
		const proj = urlSplit[ 1 ]; // wikipedia
		const lang = urlSplit[ 2 ]; // en
		// Cases where the project/lang is unsupported (e.g. proj = "facebook", for example)
		// should be handled by Earwig's.

		cv.searchParams.set( 'action', 'search' );
		cv.searchParams.set( 'lang', lang );
		cv.searchParams.set( 'project', proj );
		cv.searchParams.set( 'oldid', `${_revid}` );
		cv.searchParams.set( 'use_engine', '0' );
		cv.searchParams.set( 'use_links', '1' );
	}

	return <span class="mw-changeslist-links">
		<span><a
			rel="noopener"
			href={ cur }
			title={ mw.msg( 'deputy.session.revision.cur.tooltip' ) }
			target="_blank"
		>{ mw.msg( 'deputy.revision.cur' ) }</a></span>
		<span>{
			( !_parentid && !missing ) ?
				mw.msg( 'deputy.session.revision.prev' ) :
				<a
					rel="noopener"
					href={ prev }
					title={ mw.msg( 'deputy.session.revision.prev.tooltip' ) }
					target="_blank"
				>{ mw.msg( 'deputy.revision.prev' ) }</a>
		}</span>
		{
			cv &&
			<span>
				<a
					rel="noopener"
					href={ cv.toString() }
					title={ mw.msg( 'deputy.session.revision.cv.tooltip' ) }
					target="_blank"
				>{ mw.msg( 'deputy.session.revision.cv' ) }</a>
			</span>
		}
	</span>;
}

/**
 * @return HTML element
 */
export function NewPageIndicator(): JSX.Element {
	return <abbr
		class="newpage"
		title={ mw.msg( 'deputy.revision.new.tooltip' ) }
	>{ mw.msg( 'deputy.revision.new' ) }</abbr>;
}
/**
 * @param root0
 * @param root0.timestamp
 * @return HTML element
 */
export function ChangesListTime(
	{ timestamp }: { timestamp: string }
): JSX.Element {
	const time = new Date( timestamp );
	const formattedTime = time.toLocaleTimeString( USER_LOCALE, {
		hourCycle: 'h24',
		timeStyle: mw.user.options.get( 'date' ) === 'ISO 8601' ? 'long' : 'short'
	} );

	return <span class="mw-changeslist-time">{ formattedTime }</span>;
}

/**
 * @param root0
 * @param root0.revision
 * @param root0.link
 * @return HTML element
 */
export function ChangesListDate(
	{ revision, link }: { revision: ExpandedRevisionData, link?: boolean } |
		{ revision: { timestamp: string, texthidden?: true }, link: false }
): JSX.Element {
	// `texthidden` would be indeterminate if the `{timestamp}` type was used
	if ( revision.texthidden ) {
		// Don't give out a link if the revision was deleted
		link = false;
	}

	const time = new Date( revision.timestamp );
	let now = window.moment( time );

	if ( window.deputy && window.deputy.config.cci.forceUtc.get() ) {
		now = now.utc();
	}
	const formattedTime = time.toLocaleTimeString( USER_LOCALE, {
		hourCycle: 'h24',
		timeStyle: mw.user.options.get( 'date' ) === 'ISO 8601' ? 'long' : 'short',
		timeZone: window.deputy?.config.cci.forceUtc.get() ? 'UTC' : undefined
	} );
	const formattedDate = now.locale( USER_LOCALE ).format( {
		dmy: 'D MMMM YYYY',
		mdy: 'MMMM D, Y',
		ymd: 'YYYY MMMM D',
		'ISO 8601': 'YYYY:MM:DD[T]HH:mm:SS'
	}[ mw.user.options.get( 'date' ) as string ] );

	const comma = mw.msg( 'comma-separator' );

	return link !== false ?
		<a class="mw-changeslist-date" href={
			getRevisionURL( revision.revid, revision.page.title )
		}>{ formattedTime }{ comma }{ formattedDate }</a> :
		<span
			class={classMix(
				'mw-changeslist-date',
				revision.texthidden && 'history-deleted'
			)}
		>{ formattedTime }{ comma }{ formattedDate }</span>;
}

/**
 * @param root0
 * @param root0.revision
 * @return HTML element
 */
export function ChangesListUser( { revision }: { revision: ExpandedRevisionData } ) {
	const { user, userhidden } = revision;

	if ( userhidden ) {
		return <span class="history-user">
			<span class="history-deleted mw-userlink">{
				mw.msg( 'deputy.revision.removed.user' )
			}</span>
		</span>;
	}

	const userPage = new mw.Title( user, nsId( 'user' ) );
	const userTalkPage = new mw.Title( user, nsId( 'user_talk' ) );
	const userContribsPage = new mw.Title( 'Special:Contributions/' + user );

	return <span class="history-user">
		<a
			class="mw-userlink"
			target="_blank"
			rel="noopener"
			href={ mw.format(
				mw.config.get( 'wgArticlePath' ),
				userPage.getPrefixedDb()
			) }
			title={ userPage.getPrefixedText() }
		>{ userPage.getMainText() }</a> <span
			class="mw-usertoollinks mw-changeslist-links"
		><span><a
				class="mw-usertoollinks-talk"
				target="_blank"
				rel="noopener"
				href={mw.format(
					mw.config.get( 'wgArticlePath' ),
					userTalkPage.getPrefixedDb()
				)}
				title={ userTalkPage.getPrefixedText() }
			>{ mw.msg( 'deputy.revision.talk' ) }</a></span> <span><a
				class="mw-usertoollinks-contribs"
				target="_blank"
				rel="noopener"
				href={mw.format(
					mw.config.get( 'wgArticlePath' ),
					userContribsPage.getPrefixedDb()
				)}
				title={ userContribsPage.getPrefixedText() }
			>{ mw.msg( 'deputy.revision.contribs' ) }</a></span>
		</span>
	</span>;
}

/**
 * @param root0
 * @param root0.size
 * @return HTML element
 */
export function ChangesListBytes( { size }: { size: number } ): JSX.Element {
	return <span
		class="history-size mw-diff-bytes"
		data-mw-bytes={ size }
	>{ mw.message( 'deputy.revision.bytes', size.toString() ).text() }</span>;
}

/**
 * @param root0
 * @param root0.diffsize
 * @param root0.size
 * @return HTML element
 */
export function ChangesListDiff(
	{ diffsize, size }: { diffsize: number, size: number }
): JSX.Element {
	const DiffTag = (
		Math.abs( diffsize ) > 500 ?
			'strong' :
			'span'
	) as keyof JSX.IntrinsicElements;

	return <DiffTag class={ `mw-plusminus-${
		diffsize === 0 ? 'null' :
			( diffsize > 0 ? 'pos' : 'neg' )
	} mw-diff-bytes` } title={
		mw.message(
			'deputy.revision.byteChange',
			Math.abs( size ).toString()
		).text()
	}>
		{
			diffsize === 0 ? '0' : mw.message(
				`deputy.${
					diffsize < 0 ? 'negativeDiff' : 'positiveDiff'
				}`,
				Math.abs( diffsize ).toString()
			).text()
		}
	</DiffTag>;
}

/**
 * @param root0
 * @param root0.page
 * @param root0.page.title
 * @param root0.page.ns
 * @return HTML element
 */
export function ChangesListPage(
	{ page }: { page: { title: string, ns: number } }
): JSX.Element {
	const pageTitle =
		new mw.Title( page.title, page.ns ).getPrefixedText();

	return <a
		class="mw-contributions-title"
		href={mw.util.getUrl( pageTitle )}
		title={pageTitle}
	>{pageTitle}</a>;
}

/**
 * @param root0
 * @param root0.tags
 * @return HTML element
 */
export function ChangesListTags( { tags }: { tags: string[] } ): JSX.Element {
	return <span class="mw-tag-markers"><a
		rel="noopener"
		href={mw.format(
			mw.config.get( 'wgArticlePath' ),
			'Special:Tags'
		)}
		title="Special:Tags"
		target="_blank"
	>{ mw.message(
			'deputy.revision.tags',
			tags.length.toString()
		).text() }</a>{
		tags.map( ( v ) => {
			// eslint-disable-next-line mediawiki/msg-doc
			const tagMessage = mw.message( `tag-${ v }` ).parseDom();
			return [
				' ',
				tagMessage.text() !== '-' && unwrapJQ(
					<span
						class={ `mw-tag-marker mw-tag-marker-${ v }` }
					/>,
					tagMessage
				)
			];
		} )
	}
	</span>;
}

/**
 *
 * @param root0
 * @param root0.revision
 */
export function ChangesListMissingRow(
	{ revision }: {
		revision: ExpandedRevisionData
	}
): JSX.Element {
	return <span>
		{' '}<i dangerouslySetInnerHTML={mw.message(
			'deputy.session.revision.missing',
			revision.revid
		).parse()}/>
	</span>;
}

/**
 * @param root0
 * @param root0.revision
 * @param root0.format
 * @return A changes list row.
 */
export function ChangesListRow(
	{ revision, format }: {
		revision: ExpandedRevisionData,
		format?: 'history' | 'contribs'
	}
): JSX.Element {
	if ( !format ) {
		format = 'history';
	}

	let commentElement: ComponentChild = '';
	if ( revision.commenthidden ) {
		commentElement = <span class="history-deleted comment">{
			mw.msg( 'deputy.revision.removed.comment' )
		}</span>;
	} else if ( revision.parsedcomment ) {
		commentElement = <span
			class="comment comment--without-parentheses"
			/** Stranger danger! Yes. */
			dangerouslySetInnerHTML={ revision.parsedcomment }
		/>;
	} else if ( revision.comment ) {
		const comment = revision.comment
			// Insert Word-Joiner to avoid parsing "templates".
			.replace( /{/g, '{\u2060' )
			.replace( /}/g, '\u2060}' );

		commentElement = unwrapJQ( <span
			class="comment comment--without-parentheses"
		/>, msgEval( comment ).parseDom() );
	}

	return <span>
		<ChangesListLinks
			revid={ revision.revid }
			parentid={ revision.parentid }
		/> {
			!revision.parentid && <NewPageIndicator />
		}<ChangesListTime
			timestamp={ revision.timestamp }
		/><ChangesListDate
			revision={ revision }
		/> { format === 'history' && <ChangesListUser
			revision={ revision }
		/> } <span
			class="mw-changeslist-separator"
		/> { format === 'history' && <ChangesListBytes
			size={ revision.size }
		/> } <ChangesListDiff
			size={ revision.size }
			diffsize={ revision.diffsize }
		/> <span
			class="mw-changeslist-separator"
		/> { format === 'contribs' && <ChangesListPage
			page={ revision.page }
		/>} { commentElement } {
			( revision.tags?.length ?? -1 ) > 0 &&
			<ChangesListTags tags={revision.tags} />
		}
	</span>;
}
