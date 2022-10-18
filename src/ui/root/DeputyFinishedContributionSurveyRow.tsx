import { h } from 'tsx-dom';
import '../../types';
import ContributionSurveyRow from '../../models/ContributionSurveyRow';
import guessAuthor from '../../wiki/util/guessAuthor';
import nsId from '../../wiki/util/nsId';
import type { Moment } from 'moment';
import { guessTrace } from '../../models/DeputyTrace';

/**
 * Displayed when a ContributionSurveyRow has no remaining diffs. Deputy is not able
 * to perform the contribution survey itself, so there is no revision list.
 */
export default class DeputyFinishedContributionSurveyRow {

	props: {
		originalElement: HTMLLIElement,
		row: ContributionSurveyRow
	};

	/**
	 * The author of the comment (if one exists).
	 */
	author: string;
	/**
	 * The timestamp of the signature. A `moment.js` object.
	 */
	timestamp: Moment;

	/**
	 * @param props Element properties
	 * @param props.row The reference row
	 * @param props.originalElement
	 * @return An HTML element
	 */
	constructor( props: DeputyFinishedContributionSurveyRow['props'] ) {
		this.props = props;
	}

	/**
	 * Checks if this row has a signature.
	 *
	 * @return `true` if this row's comment has a signature
	 */
	hasSignature(): boolean | 'maybe' {
		return this.author ? ( this.timestamp ? true : 'maybe' ) : false;
	}

	/**
	 * Renders the element.
	 *
	 * @return The rendered row content
	 */
	render(): JSX.Element {
		const props = this.props;

		const parser = window.deputy.session.rootSession.parser;
		// Use DiscussionTools to identify the user and timestamp.
		let parsedComment;
		try {
			parsedComment = parser.parse( props.originalElement )?.commentItems?.[ 0 ];
		} catch ( e ) {
			console.warn( 'Failed to parse user signature.', e );
		}
		if ( !parsedComment ) {
			// See if the Deputy trace exists.
			const fromTrace = guessTrace( props.row.wikitext );

			if ( fromTrace ) {
				this.author = fromTrace.author;
				this.timestamp = fromTrace.timestamp && !isNaN( fromTrace.timestamp.getTime() ) ?
					window.moment( fromTrace.timestamp ) :
					undefined;
			} else {
				// Fall back to guessing the author based on an in-house parser.
				this.author = guessAuthor( props.row.comment );
				// Don't even try to guess the timestamp.
			}
		} else {
			this.author = parsedComment.author;
			this.timestamp = parsedComment.timestamp;
		}

		if ( this.author ) {
			const userPage = new mw.Title(
				this.author, nsId( 'user' )
			);
			const talkPage = userPage.getTalkPage();
			const contribsPage = new mw.Title( 'Special:Contributions/' + this.author );

			const params: string[] = [
				( <span>
					<a
						target="_blank"
						rel="noopener" href={ mw.util.getUrl( userPage.getPrefixedDb() ) }
						title={ userPage.getPrefixedText() }
					>{ this.author }</a> <span class="mw-usertoollinks mw-changeslist-links">
						<span><a
							class="mw-usertoollinks-talk"
							target="_blank"
							rel="noopener" href={ mw.util.getUrl( talkPage.getPrefixedDb() ) }
							title={ talkPage.getPrefixedText() }
						>{ mw.msg( 'deputy.session.revision.talk' ) }</a></span>
						<span><a
							class="mw-usertoollinks-contribs"
							target="_blank"
							rel="noopener" href={ mw.util.getUrl( contribsPage.getPrefixedDb() ) }
							title={ contribsPage.getPrefixedText() }
						>{ mw.msg( 'deputy.session.revision.contribs' ) }</a></span>
					</span>
				</span> ).outerHTML
			];

			if ( this.timestamp ) {
				params.push(
					this.timestamp.toDate()
						.toLocaleString( 'en-US', { dateStyle: 'long', timeStyle: 'short' } ),
					this.timestamp.toNow( true )
				);
			}

			return <i
				dangerouslySetInnerHTML={
					mw.message(
						this.timestamp ?
							'deputy.session.row.checkedComplete' :
							'deputy.session.row.checked',
						...params
					).text()
				}
			/>;
		} else {
			return null;
		}
	}
}
