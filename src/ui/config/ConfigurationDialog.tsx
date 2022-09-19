import '../../types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import deputySettingsStyles from '../../css/settings.css';
import Configuration from '../../config/Configuration';
import ConfigurationGroupTabPanel from './ConfigurationGroupTabPanel';
import openWindow from '../../wiki/util/openWindow';
import deputySettingsEnglish from '../../../i18n/settings/en.json';
import DeputyLanguage from '../../DeputyLanguage';

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
					action: 'close',
					label: mw.msg( 'deputy.close' ),
					flags: 'safe'
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
		 */
		constructor() {
			super();

			// Load a fresh version of the configuration - this way we can make modifications
			// live to the configuration without actually affecting tool usage.
			this.config = Configuration.load();
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
			this.$body.append( this.layout.$element );
		}

		/**
		 * Generate TabPanelLayouts for each configuration group.
		 *
		 * @return An array of TabPanelLayouts
		 */
		generateGroupLayouts(): any[] {
			return Object.keys( this.config.all ).map(
				( group: keyof Configuration['all'] ) => ConfigurationGroupTabPanel( {
					config: this.config,
					group
				} )
			);
		}

		/**
		 *
		 * @param action
		 */
		getActionProcess( action: string ): typeof window.OO.ui.Process {
			const process = super.getActionProcess();

			if ( action === 'save' ) {
				process.next( this.config.save() );
				process.next( () => {
					mw.notify( mw.msg( 'deputy.settings.saved' ), {
						type: 'success'
					} );
					// Override local Deputy option, just in case the user wishes to
					// change the configuration again.
					mw.user.options.set( Configuration.optionKey, this.config.serialize() );
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
 * @return A ConfigurationDialog object
 */
export default function ConfigurationDialogBuilder() {
	if ( !InternalConfigurationDialog ) {
		initConfigurationDialog();
	}
	return new InternalConfigurationDialog();
}

let attached = false;

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
		mw.loader.using(
			[ 'oojs-ui-core', 'oojs-ui-windows', 'oojs-ui-widgets' ],
			() => {
				const dialog = ConfigurationDialogBuilder();
				openWindow( dialog );
			}
		);
	} );
}
