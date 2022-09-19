import '../../types';
import type Configuration from '../../config/Configuration';
import Setting from '../../config/Setting';
import { h } from 'tsx-dom';

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
		 *
		 */
		get settings() {
			return this.config.config.all[ this.config.group ];
		}

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( private readonly config: ConfigurationGroupTabPanelData ) {
			super( `configurationGroupPage_${config.group}` );

			for ( const settingKey of Object.keys( this.settings ) ) {
				const setting = this.settings[ settingKey as keyof typeof this.settings ] as
					Setting<any, any>;
				switch ( setting.displayOptions.type ) {
					default:
						this.$element.append( this.newUnimplementedField( settingKey ) );
						break;
				}
			}

			// this.$element.append();
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
				mw.msg( 'deputy.setting.' + this.config.group )
			);
		}

		/**
		 *
		 * @param settingKey
		 */
		newUnimplementedField( settingKey: string ): Element {
			return <div>
				{ mw.msg( 'deputy.setting.dialog.unimplemented' ) }
			</div>;
		}

		/**
		 *
		 * @param settingKey
		 */
		newCheckboxField( settingKey: string ): Element {
			return <div>
				{ mw.msg( 'deputy.setting.dialog.unimplemented' ) }
			</div>;
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
