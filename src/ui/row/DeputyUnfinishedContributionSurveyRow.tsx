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
		{ user && <span>Checked by {user} ( talk | contirbs )</span> }
	</div>;
}
