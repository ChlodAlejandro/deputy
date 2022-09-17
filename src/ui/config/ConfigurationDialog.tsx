import '../../types';
import Configuration from '../../config/Configuration';
import ConfigurationGroupTabPanel from './ConfigurationGroupTabPanel';

export interface ConfigurationDialogData {
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
			title: mw.message( 'deputy.setting.dialog.title' ).text(),
			size: 'huge',
			actions: [
				{
					action: 'close',
					label: mw.message( 'deputy.close' ).text(),
					flags: 'safe'
				},
				{
					action: 'save',
					label: mw.message( 'deputy.save' ).text(),
					flags: [ 'progressive, primary' ]
				}
			]
		};

		data: any;

		/**
		 *
		 * @param config
		 */
		constructor( private readonly config: ConfigurationDialogData ) {
			super();

			OO.ui.WindowManager.static.sizes.huge = {
				width: 1100
			};
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
			return Object.keys( this.config.config.all ).map(
				( group: keyof Configuration['all'] ) => ConfigurationGroupTabPanel( {
					config: this.config.config,
					group
				} )
			);
		}

	};
}

/**
 * Creates a new ConfigurationDialog.
 *
 * @param config Configuration to be passed to the element.
 * @return A ConfigurationDialog object
 */
export default function ( config: ConfigurationDialogData ) {
	if ( !InternalConfigurationDialog ) {
		initConfigurationDialog();
	}
	return new InternalConfigurationDialog( config );
}
