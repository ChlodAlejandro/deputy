import { DeputyUIElement } from '../DeputyUIElement';
import { ContributionSurveyRevision } from '../../models/ContributionSurveyRevision';
import { h } from 'tsx-dom';
import getRevisionDiffURL from '../../util/getRevisionDiffURL';
import unwrapWidget from '../../util/unwrapWidget';
import { DeputyMessageEvent, DeputyRevisionStatusUpdateMessage } from '../../DeputyCommunications';
import ContributionSurveyRow from '../../models/ContributionSurveyRow';

/**
 * A specific revision for a section row.
 */
export default class DeputyContributionSurveyRevision
	extends OO.EventEmitter implements DeputyUIElement {

	disabled: boolean;
	/**
	 * The revision that this UI element handles.
	 */
	revision: ContributionSurveyRevision;
	/**
	 * The row that this revision belongs to.
	 */
	row: ContributionSurveyRow;

	/**
	 * @return `true` the current revision has been checked by the user or `false` if not.
	 */
	get completed(): boolean {
		return this.completedCheckbox?.isSelected() ?? false;
	}
	/**
	 * Set the value of the completed checkbox.
	 *
	 * @param value The new value
	 */
	set completed( value: boolean ) {
		this.completedCheckbox?.setSelected( value );
	}

	/**
	 * The checkbox to indicate that a diff has been checked by the user.
	 *
	 * @private
	 */
	private completedCheckbox: any;

	/**
	 * @param revision
	 * @param row
	 */
	constructor( revision: ContributionSurveyRevision, row: ContributionSurveyRow ) {
		super();
		this.revision = revision;
		this.row = row;
	}

	readonly revisionStatusUpdateListener = this.onRevisionStatusUpdate.bind( this );

	/**
	 * Listener for revision status updates from the root session.
	 *
	 * @param root0
	 * @param root0.data
	 */
	onRevisionStatusUpdate(
		{ data }: DeputyMessageEvent<DeputyRevisionStatusUpdateMessage>
	): void {
		if (
			this.row.casePage.pageId === data.caseId &&
			this.row.title.getPrefixedText() === data.page &&
			this.revision.revid === data.revision
		) {
			this.completedCheckbox.setSelected( data.status );
			window.deputy.comms.reply( data, {
				type: 'acknowledge'
			} );
		}
	}

	/**
	 * Performs cleanup before removal.
	 */
	close(): void {
		window.deputy.comms.removeEventListener(
			'revisionStatusUpdate',
			this.revisionStatusUpdateListener
		);
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

		this.completedCheckbox = new OO.ui.CheckboxInputWidget( {
			label: mw.message( 'deputy.session.revision.assessed' ).text()
		} );

		this.completedCheckbox.on( 'change', ( checked: boolean ) => {
			this.emit( 'update', checked, this.revision );
		} );
		window.deputy.comms.addEventListener(
			'revisionStatusUpdate',
			this.revisionStatusUpdateListener
		);

		const comma = mw.message( 'comma-separator' ).text();

		return <div
			class={ ( this.revision.tags ?? [] ).map( ( v ) => 'mw-tag-' + v ).join( ' ' ) }
		>
			{ unwrapWidget( this.completedCheckbox ) }
			<span class="mw-changeslist-links">
				<span><a rel="noopener" href={
					getRevisionDiffURL( this.revision.revid, 0 )
				} title="Difference with latest revision" target="_blank">
					{ mw.message( 'deputy.session.revision.cur' ).text() }
				</a></span>
				<span>{
					!this.revision.parentid ?
						mw.message( 'deputy.session.revision.prev' ).text() :
						<a rel="noopener" href={
							!this.revision.parentid ?
								null :
								getRevisionDiffURL( this.revision.parentid, this.revision.revid )
						} title="Difference with preceding revision" target="_blank">
							{ mw.message( 'deputy.session.revision.prev' ).text() }
						</a>
				}</span>
			</span>
			<span class="mw-changeslist-time">{ formattedTime }</span>
			<span class="mw-changeslist-date">{ formattedTime }{
				comma
			}{ formattedDate }</span>
			<span class="history-user">
				<a class="mw-userlink" target="_blank" rel="noopener" href={
					mw.format(
						mw.config.get( 'wgArticlePath' ),
						userPage.getPrefixedDb()
					)
				} title={ userPage.getPrefixedText() }>{ userPage.getPrefixedText() }</a> <span
					class="mw-usertoollinks mw-changeslist-links"
				>
					<span>
						<a class="mw-usertoollinks-talk" target="_blank" rel="noopener" href={
							mw.format(
								mw.config.get( 'wgArticlePath' ),
								userTalkPage.getPrefixedDb()
							)
						} title={ userTalkPage.getPrefixedText() }>
							{ mw.message( 'deputy.session.revision.talk' ).text() }
						</a>
					</span>
					<span>
						<a class="mw-usertoollinks-contribs" target="_blank" rel="noopener" href={
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
						rel="noopener" href={
							mw.format(
								mw.config.get( 'wgArticlePath' ),
								'Special:Tags'
							)
						}
						title="Special:Tags"
						target="_blank"
					>
						{
							mw.message(
								'deputy.session.revision.tags',
								this.revision.tags.length.toString()
							).text()
						}
					</a>{
						this.revision.tags.map( ( v ) => {
							// eslint-disable-next-line mediawiki/msg-doc
							const tagMessage = mw.message( `tag-${v}` ).parse();
							return tagMessage !== '-' && <span
								class={ `mw-tag-marker mw-tag-marker-${v}` }
								dangerouslySetInnerHTML={tagMessage}
							/>;
						} )
					}
				</span>
			}
		</div> as HTMLElement;
	}

	/**
	 * Sets the disabled state of this section.
	 *
	 * @param disabled
	 */
	setDisabled( disabled: boolean ) {
		this.completedCheckbox?.setDisabled( disabled );

		this.disabled = disabled;
	}

}
