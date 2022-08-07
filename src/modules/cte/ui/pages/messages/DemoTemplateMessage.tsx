import { h } from 'tsx-dom';

/**
 * Displayed when the actively-edited notice is in a demonstration mode or `nocat` mode.
 *
 * @param nocat
 * @return HTML element
 */
export default function ( nocat = false ) {

	return <span>
		<b>{
			mw.message(
				nocat ? 'deputy.cci.nocat.head' : 'deputy.cci.demo.head'
			).parseDom().get()
		}</b><br/>{
			mw.message(
				nocat ? 'deputy.cci.nocat.help' : 'deputy.cci.demo.help'
			).parseDom().get()
		}<br/><span class="cte-message-button" />
		{/* The above <span> will be replaced in parent classes. */}
	</span>;
}
