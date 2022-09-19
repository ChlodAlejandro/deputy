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
					case 'checkboxes':
						this.$element.append( this.newCheckboxesField( settingKey, setting ) );
						break;
					case 'radio':
						this.$element.append( this.newRadioField( settingKey, setting ) );
						break;
					default:
						this.$element.append( this.newUnimplementedField( settingKey ) );
						break;
				}
			}

			this.on( 'change', () => {
				console.log( this.config.config );
			} );
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
		 * @param settingKey
		 * @param allowedValues
		 * @return a tuple array of allowed values that can be used in OOUI `items` parameters.
		 */
		getAllowedValuesArray(
			settingKey: string,
			allowedValues: string[] | Record<string, any>
		): [string, string][] {
			const items: [string, string][] = [];
			if ( Array.isArray( allowedValues ) ) {
				for ( const key of allowedValues ) {
					const message = mw.message(
						`deputy.setting.${this.config.group}.${settingKey}.${key}`
					);

					items.push( [ key, message.exists() ? message.text() : key ] );
				}
			} else {
				for ( const key of Object.keys( allowedValues ) ) {
					const message = mw.message(
						`deputy.setting.${this.config.group}.${settingKey}.${key}`
					);

					items.push( [ key, message.exists() ? message.text() : key ] );
				}
			}
			return items;
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

			field.on( 'change', () => {
				setting.set( field.isSelected() );
				this.emit( 'change' );
			} );
			// Attach disabled re-checker
			this.on( 'change', () => {
				field.setDisabled( setting.disabled );
			} );

			return <div class="deputy-setting">{ unwrapWidget( layout ) }</div>;
		}

		/**
		 * Creates a new checkbox set field.
		 *
		 * @param settingKey
		 * @param setting
		 * @return An HTMLElement of the given setting's field.
		 */
		newCheckboxesField( settingKey: string, setting: Setting<any, any> ): Element {
			const isDisabled = setting.disabled;
			const desc = mw.message(
				`deputy.setting.${this.config.group}.${settingKey}.description`
			);

			const field = new OO.ui.CheckboxMultiselectInputWidget( {
				value: setting.get(),
				disabled: isDisabled !== undefined && isDisabled !== false,
				options: this.getAllowedValuesArray( settingKey, setting.allowedValues )
					.map( ( [ key, label ] ) => ( { data: key, label } ) )
			} );
			const layout = new OO.ui.FieldLayout( field, {
				align: 'top',
				label: mw.msg( `deputy.setting.${this.config.group}.${settingKey}.name` ),
				help: typeof isDisabled === 'string' ?
					mw.msg( `deputy.setting.${this.config.group}.${settingKey}.${isDisabled}` ) :
					desc.exists() ? desc.text() : undefined,
				helpInline: true
			} );

			field.on( 'change', ( items: string[] ) => {
				const finalData = Array.isArray( setting.allowedValues ) ?
					items :
					( field.findSelectedItemsData() as string[] ).map(
						( v ) => ( setting.allowedValues as Record<string, string> )[ v ]
					);
				setting.set( finalData );
				this.emit( 'change' );
			} );
			// Attach disabled re-checker
			this.on( 'select', () => {
				field.setDisabled( setting.disabled );
			} );

			return <div class="deputy-setting">{ unwrapWidget( layout ) }</div>;
		}

		/**
		 * Creates a new radio set field.
		 *
		 * @param settingKey
		 * @param setting
		 * @return An HTMLElement of the given setting's field.
		 */
		newRadioField( settingKey: string, setting: Setting<any, any> ): Element {
			const isDisabled = setting.disabled;
			const desc = mw.message(
				`deputy.setting.${this.config.group}.${settingKey}.description`
			);

			const field = new OO.ui.RadioSelectWidget( {
				disabled: isDisabled !== undefined && isDisabled !== false,
				items: this.getAllowedValuesArray( settingKey, setting.allowedValues )
					.map( ( [ key, label ] ) =>
						new OO.ui.RadioOptionWidget( {
							data: key,
							label: label,
							selected: setting.get() === key
						} )
					),
				multiselect: false
			} );
			const layout = new OO.ui.FieldLayout( field, {
				align: 'top',
				label: mw.msg( `deputy.setting.${this.config.group}.${settingKey}.name` ),
				help: typeof isDisabled === 'string' ?
					mw.msg( `deputy.setting.${this.config.group}.${settingKey}.${isDisabled}` ) :
					desc.exists() ? desc.text() : undefined,
				helpInline: true
			} );

			// OOUIRadioInputWidget
			field.on( 'select', ( items: any ) => {
				const finalData = Array.isArray( setting.allowedValues ) ?
					items.data :
					setting.allowedValues[ items.data ];
				setting.set( finalData );
				this.emit( 'change' );
			} );
			// Attach disabled re-checker
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
