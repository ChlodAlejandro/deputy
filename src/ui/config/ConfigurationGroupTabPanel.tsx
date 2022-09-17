import '../../types';
import type Configuration from '../../config/Configuration';

export interface ConfigurationGroupTabPanelData {
	config: Configuration;
	group: keyof Configuration['all'];
}

let InternalConfigurationGroupTabPanel: any;

/**
 * Initializes the process element.
 */
function initConfigurationGroupTabPanel() {
	InternalConfigurationGroupTabPanel = class ConfigurationGroupTabPanel
		extends OO.ui.TabPanelLayout {

		data: any;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( private readonly config: ConfigurationGroupTabPanelData ) {
			super( `configurationGroupPage_${config.group}` );

			this.$element.append( 'Hello World' );
		}

		/**
		 * Sets up the tab item
		 */
		setupTabItem() {
			this.tabItem.setLabel(
				// Messages used here:
				// * deputy.setting.core
				// * deputy.setting.cci
				// * deputy.setting.ante
				// * deputy.setting.ia
				mw.message( 'deputy.setting.' + this.config.group ).text()
			);
		}

	};
}

/**
 * Creates a new ConfigurationGroupTabPanel.
 *
 * @param config Configuration to be passed to the element.
 * @return A ConfigurationGroupTabPanel object
 */
export default function ( config: ConfigurationGroupTabPanelData ) {
	if ( !InternalConfigurationGroupTabPanel ) {
		initConfigurationGroupTabPanel();
	}
	return new InternalConfigurationGroupTabPanel( config );
}
