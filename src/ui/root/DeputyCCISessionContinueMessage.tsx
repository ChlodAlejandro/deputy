import { h } from 'tsx-dom';
import DeputyCasePage from '../../wiki/DeputyCasePage';

/**
 * Displayed when a user has previously worked on a case page and is now visiting
 * the page again (with no active session). Displayed inside an OOUI message box.
 *
 * @param props
 * @param props.casePage
 * @return HTML element
 */
export default function ( props: { casePage: DeputyCasePage} ) {

	return <span>
		<b>{
			mw.message(
				'deputy.session.continue.head',
				new Date().toLocaleString(
					mw.config.get( 'wgUserLanguage' ),
					{ dateStyle: 'long', timeStyle: 'medium' }
				)
			).text()
		}</b><br/>{
			mw.message(
				'deputy.session.continue.help',
				props.casePage.lastActiveSections[ 0 ]
			).text()
		}<br/><span class="dp-cs-session-continue" />
		{/* The above <span> will be replaced in DeputySession. */}
	</span>;
}
