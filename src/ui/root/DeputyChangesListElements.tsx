import '../../types';
import { h } from 'tsx-dom';
import { ContributionSurveyRevision } from '../../models/ContributionSurveyRevision';
import getRevisionURL from '../../wiki/util/getRevisionURL';
import getRevisionDiffURL from '../../wiki/util/getRevisionDiffURL';
import nsId from '../../wiki/util/nsId';

/**
 * @param root0
 * @param root0.revid
 * @param root0.parentid
 * @return HTML element
 */
export function ChangesListLinks(
	{ revid, parentid }: { revid: number, parentid: number }
): JSX.Element {
	return <span class="mw-changeslist-links">
		<span><a
			rel="noopener"
			href={ getRevisionDiffURL( revid, 0 ) }
			title={ mw.msg( 'deputy.session.revision.cur.tooltip' ) }
			target="_blank"
		>{ mw.msg( 'deputy.session.revision.cur' ) }</a></span>
		<span>{
			!parentid ?
				mw.msg( 'deputy.session.revision.prev' ) :
				<a
					rel="noopener"
					href={ !parentid ?
						null :
						getRevisionDiffURL( parentid, revid )
					}
					title={ mw.msg( 'deputy.session.revision.prev.tooltip' ) }
					target="_blank"
				>{ mw.msg( 'deputy.session.revision.prev' ) }</a>
		}</span>
	</span>;
}

/**
 * @return HTML element
 */
export function NewPageIndicator(): JSX.Element {
	return <abbr
		class="newpage"
		title={ mw.msg( 'deputy.session.revision.new.tooltip' ) }
	>{ mw.msg( 'deputy.session.revision.new' ) }</abbr>;
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
	const formattedTime = time.toLocaleTimeString( window.deputyLang, {
		hourCycle: 'h24',
		timeStyle: mw.user.options.get( 'date' ) === 'ISO 8601' ? 'long' : 'short'
	} );

	return <span class="mw-changeslist-time">{ formattedTime }</span>;
}

/**
 * @param root0
 * @param root0.revision
 * @return HTML element
 */
export function ChangesListDate(
	{ revision }: { revision: ContributionSurveyRevision }
): JSX.Element {
	const time = new Date( revision.timestamp );
	let now = window.moment( time );

	if ( window.deputy.config.cci.forceUtc.get() ) {
		now = now.utc();
	}
	const formattedTime = time.toLocaleTimeString( window.deputyLang, {
		hourCycle: 'h24',
		timeStyle: mw.user.options.get( 'date' ) === 'ISO 8601' ? 'long' : 'short',
		timeZone: window.deputy.config.cci.forceUtc.get() ? 'UTC' : undefined
	} );
	const formattedDate = now.locale( window.deputyLang ).format( {
		dmy: 'D MMMM YYYY',
		mdy: 'MMMM D, Y',
		ymd: 'YYYY MMMM D',
		'ISO 8601': 'YYYY:MM:DD[T]HH:mm:SS'
	}[ mw.user.options.get( 'date' ) as string ] );

	const comma = mw.msg( 'comma-separator' );

	return <a class="mw-changeslist-date" href={
		getRevisionURL( revision.revid, revision.page.title )
	}>{ formattedTime }{ comma }{ formattedDate }</a>;
}

/**
 * @param root0
 * @param root0.user
 * @return HTML element
 */
export function ChangesListUser( { user }: { user: string } ) {
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
			>{ mw.msg( 'deputy.session.revision.talk' ) }</a></span> <span><a
				class="mw-usertoollinks-contribs"
				target="_blank"
				rel="noopener"
				href={mw.format(
					mw.config.get( 'wgArticlePath' ),
					userContribsPage.getPrefixedDb()
				)}
				title={ userContribsPage.getPrefixedText() }
			>{ mw.msg( 'deputy.session.revision.contribs' ) }</a></span>
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
	>{ mw.message( 'deputy.session.revision.bytes', size.toString() ).text() }</span>;
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
			'deputy.session.revision.byteChange',
			size.toString()
		).text()
	}>
		{
			mw.message(
				`deputy.${
					diffsize < 0 ? 'negative' : 'positive'
				}Diff`,
				diffsize.toString()
			).text()
		}
	</DiffTag>;
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
			'deputy.session.revision.tags',
			tags.length.toString()
		).text() }</a>{
		tags.map( ( v ) => {
			// eslint-disable-next-line mediawiki/msg-doc
			const tagMessage = mw.message( `tag-${ v }` ).parse();
			return tagMessage !== '-' && <span
				class={ `mw-tag-marker mw-tag-marker-${ v }` }
				dangerouslySetInnerHTML={ tagMessage }
			/>;
		} )
	}
	</span>;
}
