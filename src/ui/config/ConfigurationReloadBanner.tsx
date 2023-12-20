import '../../types';
import unwrapWidget from '../../util/unwrapWidget';
import DeputyMessageWidget from '../shared/DeputyMessageWidget';

/**
 * @return A MessageWidget for reloading a page with an outdated configuration.
 */
export default function ConfigurationReloadBanner(): JSX.Element {
	const reloadButton = new OO.ui.ButtonWidget( {
		flags: [ 'progressive', 'primary' ],
		label: mw.msg( 'deputy.settings.wikiOutdated.reload' )
	} );
	const messageBox = DeputyMessageWidget( {
		classes: [
			'deputy', 'dp-mb', 'dp-wikiConfigUpdateMessage'
		],
		type: 'notice',
		title: mw.msg( 'deputy.settings.wikiOutdated' ),
		message: mw.msg( 'deputy.settings.wikiOutdated.help' ),
		actions: [ reloadButton ]
	} );

	reloadButton.on( 'click', async () => {
		window.location.reload();
	} );

	const box = unwrapWidget( messageBox );
	box.style.fontSize = 'calc(1em * 0.875)';
	return box;
}
