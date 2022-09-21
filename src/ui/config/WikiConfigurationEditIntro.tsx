import unwrapWidget from '../../util/unwrapWidget';
import { h } from 'tsx-dom';
import WikiConfiguration from '../../config/WikiConfiguration';
import swapElements from '../../util/swapElements';
import ConfigurationDialogBuilder from './ConfigurationDialog';
import openWindow from '../../wiki/util/openWindow';
import normalizeTitle from '../../wiki/util/normalizeTitle';

/**
 * @param config The current configuration
 * @return An HTML element consisting of an OOUI MessageWidget
 */
export default function WikiConfigurationEditIntro( config: WikiConfiguration ): JSX.Element {
	const r = 'deputy-' + Math.random().toString().slice( 2 );
	const current = config.onConfigurationPage();

	const messageBox = new OO.ui.MessageWidget( {
		classes: [
			'deputy', 'dp-mb'
		],
		type: 'info',
		label: new OO.ui.HtmlSnippet( ( <span>
			<b>{
				mw.msg( 'deputy.settings.wikiEditIntro.title' )
			}</b><br/>{
				current ?
					mw.msg( 'deputy.settings.wikiEditIntro.current' ) :
					<span dangerouslySetInnerHTML={
						mw.message(
							'deputy.settings.wikiEditIntro.other',
							config.sourcePage.getPrefixedText()
						).parse()
					} />
			}<br/>
			<span id={r}></span>
		</span> ).innerHTML )
	} );

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
			const configWindow = ConfigurationDialogBuilder( { config } );
			openWindow( configWindow );
		} );
		buttons = [ editCurrent ];
	} else {
		const editCurrent = new OO.ui.ButtonWidget( {
			flags: [ 'progressive', 'primary' ],
			label: mw.msg( 'deputy.settings.wikiEditIntro.edit.otherCurrent' ),
			disabled: config.editable,
			title: config.editable ?
				undefined : mw.msg( 'deputy.settings.wikiEditIntro.edit.protected' )
		} );
		editCurrent.on( 'click', async () => {
			const configWindow = ConfigurationDialogBuilder( { config } );
			openWindow( configWindow );
		} );
		const editOther = new OO.ui.ButtonWidget( {
			flags: [ 'progressive' ],
			label: mw.msg( 'deputy.settings.wikiEditIntro.edit.other' ),
			disabled: !mw.config.get( 'wgIsProbablyEditable' ),
			title: mw.config.get( 'wgIsProbablyEditable' ) ?
				undefined : mw.msg( 'deputy.settings.wikiEditIntro.edit.protected' )
		} );
		editOther.on( 'click', async () => {
			const configWindow = ConfigurationDialogBuilder( {
				config: await config.static.load( normalizeTitle() )
			} );
			openWindow( configWindow );
		} );
		buttons = [ editCurrent, editOther ];
	}

	const box = unwrapWidget( messageBox );
	swapElements( box.querySelector( `#${r}` ), <span>
		{ buttons.map( b => unwrapWidget( b ) ) }
	</span> );

	box.classList.add( 'deputy', 'deputy-wikiConfig-intro' );

	return box;
}
