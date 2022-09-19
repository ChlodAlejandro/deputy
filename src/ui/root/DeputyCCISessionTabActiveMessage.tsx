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
			mw.msg( 'deputy.session.tabActive.head' )
		}</b><br/>{
			mw.msg( 'deputy.session.tabActive.help' )
		}
	</span>;
}
