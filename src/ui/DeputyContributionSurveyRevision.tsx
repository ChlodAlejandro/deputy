import { DeputyUIElement } from './DeputyUIElement';
import { ContributionSurveyRevision } from '../models/ContributionSurveyRevision';
import { h } from 'tsx-dom';
import getRevisionDiffURL from '../util/getRevisionDiffURL';
import unwrapWidget from '../util/unwrapWidget';

/**
 * A specific revision for a section row.
 */
export class DeputyContributionSurveyRevision extends OO.EventEmitter implements DeputyUIElement {

	/**
	 * The revision that this UI element handles.
	 */
	revision: ContributionSurveyRevision;

	/**
	 * @param revision
	 */
	constructor( revision: ContributionSurveyRevision ) {
		super();
		this.revision = revision;
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		const time = new Date( this.revision.timestamp );

		const formattedTime = time.toLocaleTimeString( mw.config.get( 'wgUserLanguage' ), {
			hourCycle: 'h24',
			timeStyle: 'short'
		} );
		const formattedDate = {
			dmy: time.toLocaleDateString( 'en-US', { dateStyle: 'long' } ),
			mdy: time.toLocaleDateString( 'en-GB', { dateStyle: 'long' } )
		}[ mw.config.get( 'wgDefaultDateFormat' ) as string ] ??
			`${time.getFullYear()} ${
				time.toLocaleString( mw.config.get( 'wgUserLanguage' ), { month: 'long' } )
			} ${time.getDate()}`;

		const userPage = new mw.Title(
			this.revision.user,
			mw.config.get( 'wgNamespaceIds' ).user
		);
		const userTalkPage = new mw.Title(
			this.revision.user,
			mw.config.get( 'wgNamespaceIds' ).user_talk
		);
		const userContribsPage = new mw.Title(
			'Special:Contributions/' + this.revision.user
		);

		const DiffTag = (
			Math.abs( this.revision.diffsize ) > 500 ?
				'strong' :
				'span'
		) as keyof JSX.IntrinsicElements;

		const commentElement = <span
			class="comment comment--without-parentheses"
			/** Stranger danger! Yes. */
			dangerouslySetInnerHTML={this.revision.parsedcomment}
		/>;

		const doneCheckbox = new OO.ui.CheckboxInputWidget( {
			label: mw.message( 'deputy.session.revision.assessed' ).text()
		} );

		doneCheckbox.on( 'change', ( checked: boolean ) => {
			this.emit( 'update', checked, this.revision );
		} );

		return <div
			class={ ( this.revision.tags ?? [] ).map( ( v ) => 'mw-tag-' + v ).join( ' ' ) }
		>
			{ unwrapWidget( doneCheckbox ) }
			<span class="mw-changeslist-links">
				<span><a href={
					getRevisionDiffURL( this.revision.revid, 0 )
				} title="Difference with latest revision">
					{ mw.message( 'deputy.session.revision.cur' ).text() }
				</a></span>
				<span><a href={
					getRevisionDiffURL( this.revision.parentid, this.revision.revid )
				} title="Difference with preceding revision">
					{ mw.message( 'deputy.session.revision.prev' ).text() }
				</a></span>
			</span>
			<span class="mw-changeslist-time">{ formattedTime }</span>
			<span class="mw-changeslist-date">{ formattedTime }, { formattedDate }</span>
			<span class="history-user">
				<a class="mw-userlink" href={
					mw.format(
						mw.config.get( 'wgArticlePath' ),
						userPage.getPrefixedDb()
					)
				} title={ userPage.getPrefixedText() }>{ userPage.getPrefixedText() }</a> <span
					class="mw-usertoollinks mw-changeslist-links"
				>
					<span>
						<a class="mw-usertoollinks-talk" href={
							mw.format(
								mw.config.get( 'wgArticlePath' ),
								userTalkPage.getPrefixedDb()
							)
						} title={ userTalkPage.getPrefixedText() }>
							{ mw.message( 'deputy.session.revision.talk' ).text() }
						</a>
					</span>
					<span>
						<a class="mw-usertoollinks-contribs" href={
							mw.format(
								mw.config.get( 'wgArticlePath' ),
								userContribsPage.getPrefixedDb()
							)
						} title={ userContribsPage.getPrefixedText() }>
							{ mw.message( 'deputy.session.revision.contribs' ).text() }
						</a>
					</span>
				</span>
			</span> <span class="mw-changeslist-separator"></span> <span
				class="history-size mw-diff-bytes"
				data-mw-bytes={ this.revision.size }
			>
				{ mw.message(
					'deputy.session.revision.bytes',
					this.revision.size.toString()
				).text() }
			</span> <DiffTag class={ `mw-plusminus-${
				this.revision.diffsize === 0 ? 'null' :
					( this.revision.diffsize > 0 ? 'pos' : 'neg' )
			} mw-diff-bytes` } title={
				mw.message(
					'deputy.session.revision.byteChange',
					this.revision.size.toString()
				).text()
			}>
				{
					mw.message(
						`deputy.${
							this.revision.diffsize < 0 ? 'negative' : 'positive'
						}Diff`,
						this.revision.diffsize.toString()
					).text()
				}
			</DiffTag> <span class="mw-changeslist-separator"></span> { commentElement } {
				( this.revision.tags?.length ?? -1 ) > 0 && <span class="mw-tag-markers">
					<a
						href={
							mw.format(
								mw.config.get( 'wgArticlePath' ),
								'Special:Tags'
							)
						}
						title="Special:Tags"
					>{ mw.message( 'deputy.session.revision.tags' ).text() }</a>: {
						this.revision.tags.map( ( v ) => <span
							class={ `mw-tag-marker mw-tag-marker-${v}` }
							dangerouslySetInnerHTML={ mw.message( `tag-${v}` ).parse() }
						/> )
					}
				</span>
			}
		</div> as HTMLElement;
	}

}
