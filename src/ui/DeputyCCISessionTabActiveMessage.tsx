import { h } from 'tsx-dom';

/**
 * Displayed when a user is currently working on a case page from a different
 * tab. Displayed inside an OOUI message box.
 *
 * @return HTML element
 */
export default function () {
	return <span>
		<b>{
			mw.message( 'deputy.session.tabActive.head' ).text()
		}</b><br/>{
			mw.message( 'deputy.session.tabActive.help' ).text()
		}
	</span>;
}
