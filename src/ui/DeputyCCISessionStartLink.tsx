import { h } from 'tsx-dom';
import type DeputySession from '../DeputySession';
import { ContributionSurveyHeading } from '../wiki/DeputyCasePage';

/**
 * The CCI session start link. Starts a CCI session when pressed.
 *
 * @param heading The heading to use as a basis
 * @param session The Deputy session
 * @return The link element to be displayed
 */
export default function (
	heading: ContributionSurveyHeading,
	session: DeputySession
): JSX.Element {
	const element = <span class="deputy dp-sessionStarter">
		<span class="dp-sessionStarter-bracket">[</span>
		<a onClick={() => {
			session.startSession( heading );
			element.parentElement.removeChild( element );
		}}>{mw.message( 'deputy.session.start' ).text()}</a>
		<span class="dp-sessionStarter-bracket">]</span>
	</span>;
	return element;
}
