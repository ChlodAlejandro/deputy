import { h } from 'tsx-dom';
import '../../types';
import unwrapWidget from '../../util/unwrapWidget';
import swapElements from '../../util/swapElements';

/**
 * @return A MessageWidget for reloading a page with an outdated configuration.
 */
export default function ConfigurationReloadBanner(): JSX.Element {
	const r = 'deputy-' + Math.random().toString().slice( 2 );

	const messageBox = new OO.ui.MessageWidget( {
		classes: [
			'deputy', 'dp-mb'
		],
		type: 'info',
		label: new OO.ui.HtmlSnippet( ( <span>
			<b>{
				mw.msg( 'deputy.settings.wikiOutdated' )
			}</b><br/>{
				mw.msg( 'deputy.settings.wikiOutdated.help' )
			}<br/>
			<span id={r}></span>
		</span> ).innerHTML )
	} );

	const reloadButton = new OO.ui.ButtonWidget( {
		flags: [ 'progressive', 'primary' ],
		label: mw.msg( 'deputy.settings.wikiOutdated.reload' )
	} );
	reloadButton.on( 'click', async () => {
		window.location.reload();
	} );

	const box = unwrapWidget( messageBox );
	swapElements( box.querySelector( `#${r}` ), unwrapWidget( reloadButton ) );

	box.style.fontSize = 'calc(1em * 0.875)';

	return box;
}
