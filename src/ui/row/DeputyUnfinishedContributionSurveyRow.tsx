import { h } from 'tsx-dom';
import ContributionSurveyRow from '../../models/ContributionSurveyRow';
import guessAuthor from '../../util/guessAuthor';

/**
 * Displayed when a ContributionSurveyRow has no remaining diffs. Deputy is not able
 * to perform the contribution survey itself, so there is no revision list.
 *
 * @param props Element properties
 * @param props.row The reference row
 * @return An HTML element
 */
export default function ( props: { row: ContributionSurveyRow } ): JSX.Element {
	const user = guessAuthor( props.row.comment );

	return <div>
		{ user && <span>Checked by {user} <span class="mw-usertoollinks mw-changeslist-links">
			<span><a
				class="mw-usertoollinks-talk"
				target="_blank"
				href="/wiki/User_talk:Chlod"
				title="User talk:Chlod"
			>talk</a></span>
			<span><a
				class="mw-usertoollinks-contribs"
				target="_blank"
				href="/wiki/Special:Contributions/Chlod"
				title="Special:Contributions/Chlod">contribs</a></span>
		</span></span> }
	</div>;
}
