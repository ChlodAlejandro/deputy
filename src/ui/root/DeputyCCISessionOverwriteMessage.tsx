import { h } from 'tsx-dom';

/**
 * Displayed when a user has previously worked on a case page and is now visiting
 * the page again (with no active session). Displayed inside an OOUI message box.
 *
 * @return HTML element
 */
export default function () {

	return <span>
		<b>{
			mw.msg( 'deputy.session.otherActive.head' )
		}</b><br/>{
			mw.msg( 'deputy.session.otherActive.help' )
		}<br/><span class="dp-cs-session-stop" />
		{/* The above <span> will be replaced in DeputySession. */}
	</span>;
}
