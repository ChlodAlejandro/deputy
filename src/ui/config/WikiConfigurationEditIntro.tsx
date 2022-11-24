import unwrapWidget from '../../util/unwrapWidget';
import { h } from 'tsx-dom';
import WikiConfiguration from '../../config/WikiConfiguration';
import { spawnConfigurationDialog } from './ConfigurationDialog';
import normalizeTitle from '../../wiki/util/normalizeTitle';
import DeputyMessageWidget from '../shared/DeputyMessageWidget';

/**
 * @param config The current configuration (actively loaded, not the one being viewed)
 * @return An HTML element consisting of an OOUI MessageWidget
 */
export default function WikiConfigurationEditIntro( config: WikiConfiguration ): JSX.Element {
	const current = config.onConfigurationPage();

	let buttons: any[];
	if ( current ) {
		const editCurrent = new OO.ui.ButtonWidget( {
			flags: [ 'progressive', 'primary' ],
			label: mw.msg( 'deputy.settings.wikiEditIntro.edit.current' ),
			disabled: !mw.config.get( 'wgIsProbablyEditable' ),
			title: mw.config.get( 'wgIsProbablyEditable' ) ?
				undefined : mw.msg( 'deputy.settings.wikiEditIntro.edit.protected' )
		} );
		editCurrent.on( 'click', () => {
			spawnConfigurationDialog( config );
		} );
		buttons = [ editCurrent ];
	} else {
		const editCurrent = new OO.ui.ButtonWidget( {
			flags: [ 'progressive', 'primary' ],
			label: mw.msg( 'deputy.settings.wikiEditIntro.edit.otherCurrent' ),
			disabled: !config.editable,
			title: config.editable ?
				undefined : mw.msg( 'deputy.settings.wikiEditIntro.edit.protected' )
		} );
		editCurrent.on( 'click', async () => {
			spawnConfigurationDialog( config );
		} );
		const editOther = new OO.ui.ButtonWidget( {
			flags: [ 'progressive' ],
			label: mw.msg( 'deputy.settings.wikiEditIntro.edit.other' ),
			disabled: !mw.config.get( 'wgIsProbablyEditable' ),
			title: mw.config.get( 'wgIsProbablyEditable' ) ?
				undefined : mw.msg( 'deputy.settings.wikiEditIntro.edit.protected' )
		} );
		editOther.on( 'click', async () => {
			spawnConfigurationDialog( await config.static.load( normalizeTitle() ) );
		} );
		buttons = [ editCurrent, editOther ];
	}

	const messageBox = DeputyMessageWidget( {
		classes: [
			'deputy', 'dp-mb'
		],
		type: 'info',
		title: mw.msg( 'deputy.settings.wikiEditIntro.title' ),
		message: current ?
			mw.msg( 'deputy.settings.wikiEditIntro.current' ) :
			<span dangerouslySetInnerHTML={
				mw.message(
					'deputy.settings.wikiEditIntro.other',
					config.sourcePage.getPrefixedText()
				).parse()
			} />,
		actions: buttons
	} );

	const box = unwrapWidget( messageBox );

	box.classList.add( 'deputy', 'deputy-wikiConfig-intro' );

	return box;
}
