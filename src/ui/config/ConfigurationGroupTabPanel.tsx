/* eslint-disable mediawiki/msg-doc */
import '../../types';
import type Configuration from '../../config/Configuration';
import Setting from '../../config/Setting';
import { h } from 'tsx-dom';
import unwrapWidget from '../../util/unwrapWidget';

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
		 * @return The {@Link Setting}s for this group.
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

				if ( setting.hidden ) {
					continue;
				}

				switch ( setting.displayOptions.type ) {
					case 'checkbox':
						this.$element.append( this.newCheckboxField( settingKey, setting ) );
						break;
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
		 * Creates an unimplemented setting notice.
		 *
		 * @param settingKey
		 * @return An HTMLElement of the given setting's field.
		 */
		newUnimplementedField( settingKey: string ): Element {
			const desc = mw.message(
				`deputy.setting.${this.config.group}.${settingKey}.description`
			);

			return <div class="deputy-setting">
				<b>{ mw.msg( `deputy.setting.${this.config.group}.${settingKey}.name` ) }</b>
				{ desc.exists() ? <p style={{ fontSize: '0.925em', color: '#54595d' }}>
					{ desc.text() }
				</p> : '' }
				<p>{ mw.msg( 'deputy.settings.dialog.unimplemented' ) }</p>
			</div>;
		}

		/**
		 * Creates a checkbox field.
		 *
		 * @param settingKey
		 * @param setting
		 * @return An HTMLElement of the given setting's field.
		 */
		newCheckboxField( settingKey: string, setting: Setting<any, any> ): Element {
			const isDisabled = setting.disabled;
			const desc = mw.message(
				`deputy.setting.${this.config.group}.${settingKey}.description`
			);

			const field = new OO.ui.CheckboxInputWidget( {
				selected: setting.get(),
				disabled: isDisabled !== undefined && isDisabled !== false
			} );
			const layout = new OO.ui.FieldLayout( field, {
				align: 'inline',
				label: mw.msg( `deputy.setting.${this.config.group}.${settingKey}.name` ),
				help: typeof isDisabled === 'string' ?
					mw.msg( `deputy.setting.${this.config.group}.${settingKey}.${isDisabled}` ) :
					desc.exists() ? desc.text() : undefined,
				helpInline: true
			} );

			// Attach disabled re-checker
			field.on( 'change', () => {
				setting.set( field.isSelected() );
				this.emit( 'change' );
			} );
			this.on( 'change', () => {
				field.setDisabled( setting.disabled );
			} );

			return <div class="deputy-setting">{ unwrapWidget( layout ) }</div>;
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
