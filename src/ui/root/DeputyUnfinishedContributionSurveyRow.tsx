import { h } from 'tsx-dom';
import ContributionSurveyRow from '../../models/ContributionSurveyRow';
import guessAuthor from '../../util/guessAuthor';

/**
 * Displayed when a ContributionSurveyRow has no remaining diffs. Deputy is not able
 * to perform the contribution survey itself, so there is no revision list.
 */
export default class DeputyUnfinishedContributionSurveyRow {

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
	timestamp: any;

	/**
	 * @param props Element properties
	 * @param props.row The reference row
	 * @param props.originalElement
	 * @return An HTML element
	 */
	constructor( props: DeputyUnfinishedContributionSurveyRow['props'] ) {
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
		const parsedComment = parser.parse( props.originalElement )?.commentItems?.[ 0 ];
		if ( !parsedComment ) {
			// Fall back to guessing the author based on an in-house parser.
			this.author = guessAuthor( props.row.comment );
			// Don't even try to guess the timestamp.
		} else {
			this.author = parsedComment.author;
			this.timestamp = parsedComment.timestamp;
		}

		if ( this.author ) {
			const userPage = new mw.Title(
				this.author, mw.config.get( 'wgNamespaceIds' ).user
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
						>talk</a></span>
						<span><a
							class="mw-usertoollinks-contribs"
							target="_blank"
							rel="noopener" href={ mw.util.getUrl( contribsPage.getPrefixedDb() ) }
							title={ contribsPage.getPrefixedText() }
						>contribs</a></span>
					</span>
				</span> ).outerHTML
			];

			if ( this.timestamp ) {
				params.push(
					new Date().toLocaleString( 'en-US', { dateStyle: 'long', timeStyle: 'short' } ),
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
		}

		return this.author && <i>Checked by {this.author} {
			this.timestamp && [ ' at ', this.timestamp.toLocaleString() ]
		}</i>;
	}
}
