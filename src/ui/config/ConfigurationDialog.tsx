import '../../types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import deputySettingsStyles from '../../css/settings.css';
import UserConfiguration from '../../config/UserConfiguration';
import ConfigurationGroupTabPanel from './ConfigurationGroupTabPanel';
import openWindow from '../../wiki/util/openWindow';
import deputySettingsEnglish from '../../../i18n/settings/en.json';
import DeputyLanguage from '../../DeputyLanguage';
import ConfigurationBase from '../../config/ConfigurationBase';
import ConfigurationAboutTabPanel from './ConfigurationAboutTabPanel';
import type { Configuration } from '../../config/Configuration';

interface ConfigurationDialogData {
	config: Configuration;
}

let InternalConfigurationDialog: any;

/**
 * Initializes the process element.
 */
function initConfigurationDialog() {
	InternalConfigurationDialog = class ConfigurationDialog extends OO.ui.ProcessDialog {

		static static = {
			name: 'configurationDialog',
			title: mw.msg( 'deputy.settings.dialog.title' ),
			size: 'large',
			actions: [
				{
					flags: [ 'safe', 'close' ],
					icon: 'close',
					label: mw.msg( 'deputy.ante.close' ),
					title: mw.msg( 'deputy.ante.close' ),
					invisibleLabel: true,
					action: 'close'
				},
				{
					action: 'save',
					label: mw.msg( 'deputy.save' ),
					flags: [ 'progressive', 'primary' ]
				}
			]
		};

		data: any;
		config: Configuration;

		/**
		 *
		 * @param data
		 */
		constructor( data: ConfigurationDialogData ) {
			super();
			this.config = data.config;
		}

		/**
		 * @return The body height of this dialog.
		 */
		getBodyHeight(): number {
			return 900;
		}

		/**
		 * Initializes the dialog.
		 */
		initialize() {
			super.initialize();

			this.layout = new OO.ui.IndexLayout();
			this.layout.addTabPanels( this.generateGroupLayouts() );
			if ( this.config instanceof UserConfiguration ) {
				this.layout.addTabPanels( [ ConfigurationAboutTabPanel() ] );
			}
			this.$body.append( this.layout.$element );
		}

		/**
		 * Generate TabPanelLayouts for each configuration group.
		 *
		 * @return An array of TabPanelLayouts
		 */
		generateGroupLayouts(): any[] {
			return Object.keys( this.config.all ).map(
				( group: keyof ConfigurationBase['all'] ) => ConfigurationGroupTabPanel( {
					config: this.config,
					group
				} )
			);
		}

		/**
		 *
		 * @param action
		 * @return An OOUI Process.
		 */
		getActionProcess( action: string ): typeof window.OO.ui.Process {
			const process = super.getActionProcess();

			if ( action === 'save' ) {
				process.next( this.config.save() );
				process.next( () => {
					mw.notify( mw.msg( 'deputy.settings.saved' ), {
						type: 'success'
					} );
					if ( this.config.type === 'user' ) {
						// Override local Deputy option, just in case the user wishes to
						// change the configuration again.
						mw.user.options.set( UserConfiguration.optionKey, this.config.serialize() );
						if ( window.deputy?.comms ) {
							window.deputy.comms.send( {
								type: 'userConfigUpdate',
								config: this.config.serialize()
							} );
						}
					} else if ( this.config.type === 'wiki' ) {
						// We know it is a WikiConfiguration, the instanceof check here
						// is just for type safety.
						if ( window.deputy?.comms ) {
							window.deputy.comms.send( {
								type: 'wikiConfigUpdate',
								config: {
									title: this.config.sourcePage.getPrefixedText(),
									editable: this.config.editable,
									wt: this.config.serialize()
								}
							} );
						}
						// Reload the page.
						window.location.reload();
					}
				} );
			}

			process.next( () => {
				this.close();
			} );

			return process;
		}

	};
}

/**
 * Creates a new ConfigurationDialog.
 *
 * @param data
 * @return A ConfigurationDialog object
 */
export default function ConfigurationDialogBuilder( data: ConfigurationDialogData ) {
	if ( !InternalConfigurationDialog ) {
		initConfigurationDialog();
	}
	return new InternalConfigurationDialog( data );
}

let attached = false;

/**
 * Spawns a new configuration dialog.
 *
 * @param config
 */
export function spawnConfigurationDialog( config: any ) {
	mw.loader.using(
		[
			'oojs-ui-core', 'oojs-ui-windows', 'oojs-ui-widgets', 'mediawiki.widgets'
		],
		() => {
			const dialog = ConfigurationDialogBuilder( { config } );
			openWindow( dialog );
		}
	);
}

/**
 * Attaches the "Deputy preferences" portlet link in the toolbox. Ensures that it doesn't
 * get attached twice.
 */
export async function attachConfigurationDialogPortletLink() {
	if ( document.querySelector( '#p-deputy-config' ) || attached ) {
		return;
	}
	attached = true;

	mw.util.addCSS( deputySettingsStyles );

	await DeputyLanguage.load( 'settings', deputySettingsEnglish );
	mw.util.addPortletLink(
		'p-tb',
		'#',
		mw.msg( 'deputy.settings.portlet' ),
		'deputy-config',
		mw.msg( 'deputy.settings.portlet.tooltip' )
	).addEventListener( 'click', () => {
		// Load a fresh version of the configuration - this way we can make
		// modifications live to the configuration without actually affecting
		// tool usage.
		spawnConfigurationDialog( UserConfiguration.load() );
	} );
}
