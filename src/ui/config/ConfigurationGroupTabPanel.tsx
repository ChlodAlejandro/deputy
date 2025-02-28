/* eslint-disable mediawiki/msg-doc */
import '../../types';
import Setting, { VisibleDisplayOptions } from '../../config/Setting';
import { h } from 'tsx-dom';
import unwrapWidget from '../../util/unwrapWidget';
import ConfigurationBase from '../../config/ConfigurationBase';
import UserConfiguration from '../../config/UserConfiguration';
import { Action } from '../../config/Action';
import { windowManager } from '../../wiki/util/openWindow';
import msg = OO.ui.msg;

export interface ConfigurationGroupTabPanelData {
	$overlay: JQuery;
	config: ConfigurationBase;
	group: keyof ConfigurationBase['all'];
}

let InternalConfigurationGroupTabPanel: any;

/**
 * Initializes the process element.
 */
function initConfigurationGroupTabPanel() {
	InternalConfigurationGroupTabPanel = class ConfigurationGroupTabPanel
		extends OO.ui.TabPanelLayout {

		tabItem: OO.ui.TabOptionWidget;

		data: any;
		mode: 'user' | 'wiki';

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

			this.mode = config.config instanceof UserConfiguration ? 'user' : 'wiki';

			if ( this.mode === 'wiki' ) {
				this.$element.append(
					new OO.ui.MessageWidget( {
						classes: [
							'deputy', 'dp-mb'
						],
						type: 'warning',
						label: mw.msg( 'deputy.settings.dialog.wikiConfigWarning' )
					} ).$element
				);
			}

			for ( const settingKey of Object.keys( this.settings ) ) {
				const setting = this.settings[ settingKey as keyof typeof this.settings ] as
					Setting<any, any>;

				if ( setting.isHidden( this.config.config as any ) ) {
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
					case 'text':
						this.$element.append( this.newStringField(
							settingKey,
							setting,
							( setting.displayOptions as VisibleDisplayOptions ).extraOptions
						) );
						break;
					case 'number':
						this.$element.append( this.newNumberField(
							settingKey,
							setting,
							( setting.displayOptions as VisibleDisplayOptions ).extraOptions
						) );
						break;
					case 'page':
						this.$element.append( this.newPageField(
							settingKey,
							setting,
							( setting.displayOptions as VisibleDisplayOptions ).extraOptions
						) );
						break;
					case 'code':
						this.$element.append( this.newCodeField(
							settingKey,
							setting,
							( setting.displayOptions as VisibleDisplayOptions ).extraOptions
						) );
						break;
					case 'button':
						this.$element.append( this.newButtonField(
							settingKey,
							setting as Action,
							( setting.displayOptions as VisibleDisplayOptions ).extraOptions
						) );
						break;
					default:
						this.$element.append( this.newUnimplementedField( settingKey ) );
						break;
				}
			}
		}

		/**
		 * Sets up the tab item
		 */
		setupTabItem() {
			this.tabItem.setLabel(
				this.getMsg( this.config.group )
			);
			return this;
		}

		/**
		 * @return the i18n message for this setting tab.
		 *
		 * @param messageKey
		 */
		getMsg( messageKey: string ) {
			return mw.msg( `deputy.setting.${this.mode}.${messageKey}` );
		}

		/**
		 * Gets the i18n message for a given setting.
		 *
		 * @param settingKey
		 * @param key
		 * @return A localized string
		 */
		getSettingMsg( settingKey: string, key: string ) {
			return this.getMsg( `${this.config.group}.${settingKey}.${key}` );
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
						`deputy.setting.${this.mode}.${this.config.group}.${settingKey}.${key}`
					);

					items.push( [ key, message.exists() ? message.text() : key ] );
				}
			} else {
				for ( const key of Object.keys( allowedValues ) ) {
					const message = mw.message(
						`deputy.setting.${this.mode}.${this.config.group}.${settingKey}.${key}`
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
				`deputy.setting.${this.mode}.${this.config.group}.${settingKey}.description`
			);

			return <div class="deputy-setting">
				<b>{ this.getSettingMsg( settingKey, 'name' ) }</b>
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
			const isDisabled = setting.isDisabled( this.config.config as any );
			const desc = mw.message(
				`deputy.setting.${this.mode}.${this.config.group}.${settingKey}.description`
			);

			const field = new OO.ui.CheckboxInputWidget( {
				selected: setting.get(),
				disabled: isDisabled !== undefined && isDisabled !== false
			} );
			const layout = new OO.ui.FieldLayout( field, {
				align: 'inline',
				label: this.getSettingMsg( settingKey, 'name' ),
				help: typeof isDisabled === 'string' ?
					this.getSettingMsg( settingKey, isDisabled ) :
					desc.exists() ? desc.text() : undefined,
				helpInline: true
			} );

			field.on( 'change', () => {
				setting.set( field.isSelected() );
				this.emit( 'change' );
			} );
			// Attach disabled re-checker
			this.on( 'change', () => {
				field.setDisabled( !!setting.isDisabled( this.config.config as any ) );
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
			const isDisabled = setting.isDisabled( this.config.config as any );
			const desc = mw.message(
				`deputy.setting.${this.mode}.${this.config.group}.${settingKey}.description`
			);

			const field = new OO.ui.CheckboxMultiselectInputWidget( {
				value: setting.get(),
				disabled: isDisabled !== undefined && isDisabled !== false,
				options: this.getAllowedValuesArray( settingKey, setting.allowedValues )
					.map( ( [ key, label ] ) => ( { data: key, label } ) )
			} );
			const layout = new OO.ui.FieldLayout( field, {
				align: 'top',
				label: this.getSettingMsg( settingKey, 'name' ),
				help: typeof isDisabled === 'string' ?
					this.getSettingMsg( settingKey, isDisabled ) :
					desc.exists() ? desc.text() : undefined,
				helpInline: true
			} );

			// TODO: @types/oojs-ui limitation
			( field as any ).on( 'change', ( items: string[] ) => {
				const finalData = Array.isArray( setting.allowedValues ) ?
					items :
					( field.getValue() as unknown as string[] ).map(
						( v ) => ( setting.allowedValues as Record<string, string> )[ v ]
					);
				setting.set( finalData );
				this.emit( 'change' );
			} );
			// Attach disabled re-checker
			this.on( 'change', () => {
				field.setDisabled( !!setting.isDisabled( this.config.config as any ) );
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
			const isDisabled = setting.isDisabled( this.config.config as any );
			const desc = mw.message(
				`deputy.setting.${this.mode}.${this.config.group}.${settingKey}.description`
			);

			const field = new OO.ui.RadioSelectWidget( {
				disabled: isDisabled !== undefined && isDisabled !== false &&
					!( setting.displayOptions.readOnly ?? false ),
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
				label: this.getSettingMsg( settingKey, 'name' ),
				help: typeof isDisabled === 'string' ?
					this.getSettingMsg( settingKey, isDisabled ) :
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
				field.setDisabled( !!setting.isDisabled( this.config.config as any ) );
			} );

			return <div class="deputy-setting">{ unwrapWidget( layout ) }</div>;
		}

		/**
		 * Creates a new field that acts like a string field.
		 *
		 * @param FieldClass
		 * @param settingKey
		 * @param setting
		 * @param extraFieldOptions
		 * @return A Deputy setting field
		 */
		newStringLikeField(
			FieldClass: any,
			settingKey: string,
			setting: Setting<any, any>,
			extraFieldOptions: Record<string, any> = {}
		): Element {
			const isDisabled = setting.isDisabled( this.config.config as any );
			const desc = mw.message(
				`deputy.setting.${this.mode}.${this.config.group}.${settingKey}.description`
			);

			const field = new FieldClass( {
				readOnly: setting.displayOptions.readOnly ?? false,
				value: setting.serialize?.( setting.get() ) ?? setting.get(),
				disabled: isDisabled !== undefined && isDisabled !== false,
				...extraFieldOptions
			} );
			const layout = new OO.ui.FieldLayout( field, {
				align: 'top',
				label: this.getSettingMsg( settingKey, 'name' ),
				help: typeof isDisabled === 'string' ?
					this.getSettingMsg( settingKey, isDisabled ) :
					desc.exists() ? desc.text() : undefined,
				helpInline: true
			} );

			if ( FieldClass === OO.ui.NumberInputWidget ) {
				field.on( 'change', ( value: string ) => {
					setting.set( +value );
					this.emit( 'change' );
				} );
			} else {
				field.on( 'change', ( value: string ) => {
					setting.set( value );
					this.emit( 'change' );
				} );
			}
			// Attach disabled re-checker
			this.on( 'change', () => {
				field.setDisabled( setting.isDisabled( this.config.config as any ) );
			} );

			return <div class="deputy-setting">{ unwrapWidget( layout ) }</div>;
		}

		/**
		 * Creates a new string setting field.
		 *
		 * @param settingKey
		 * @param setting
		 * @param extraFieldOptions
		 * @return An HTMLElement of the given setting's field.
		 */
		newStringField(
			settingKey: string,
			setting: Setting<any, any>,
			extraFieldOptions?: Record<string, any>
		): Element {
			return this.newStringLikeField(
				OO.ui.TextInputWidget,
				settingKey,
				setting,
				extraFieldOptions
			);
		}

		/**
		 * Creates a new number setting field.
		 *
		 * @param settingKey
		 * @param setting
		 * @param extraFieldOptions
		 * @return An HTMLElement of the given setting's field.
		 */
		newNumberField(
			settingKey: string,
			setting: Setting<any, any>,
			extraFieldOptions?: Record<string, any>
		): Element {
			return this.newStringLikeField(
				OO.ui.NumberInputWidget,
				settingKey,
				setting,
				extraFieldOptions
			);
		}

		/**
		 * Creates a new page title setting field.
		 *
		 * @param settingKey
		 * @param setting
		 * @param extraFieldOptions
		 * @return An HTMLElement of the given setting's field.
		 */
		newPageField(
			settingKey: string,
			setting: Setting<any, any>,
			extraFieldOptions?: Record<string, any>
		): Element {
			return this.newStringLikeField(
				mw.widgets.TitleInputWidget,
				settingKey,
				setting,
				extraFieldOptions
			);
		}

		/**
		 * Creates a new code setting field.
		 *
		 * @param settingKey
		 * @param setting
		 * @param extraFieldOptions
		 * @return An HTMLElement of the given setting's field.
		 */
		newCodeField(
			settingKey: string,
			setting: Setting<any, any>,
			extraFieldOptions?: Record<string, any>
		): Element {
			return this.newStringLikeField(
				OO.ui.MultilineTextInputWidget,
				settingKey,
				setting,
				extraFieldOptions
			);
		}

		/**
		 * Creates a new button setting field.
		 *
		 * @param settingKey
		 * @param setting
		 * @param extraFieldOptions
		 * @return An HTMLElement of the given setting's field.
		 */
		newButtonField(
			settingKey: string,
			setting: Action,
			extraFieldOptions?: Record<string, any>
		): Element {
			const isDisabled = setting.isDisabled( this.config.config as any );
			const msgPrefix = `deputy.setting.${this.mode}.${this.config.group}.${settingKey}`;

			const desc = mw.message(
				`${msgPrefix}.description`
			);

			const field = new OO.ui.ButtonWidget( {
				label: this.getSettingMsg( settingKey, 'name' ),
				disabled: isDisabled !== undefined && isDisabled !== false,
				...extraFieldOptions
			} );
			const layout = new OO.ui.FieldLayout( field, {
				align: 'top',
				label: this.getSettingMsg( settingKey, 'name' ),
				help: typeof isDisabled === 'string' ?
					this.getSettingMsg( settingKey, isDisabled ) :
					desc.exists() ? desc.text() : undefined,
				helpInline: true
			} );

			field.on( 'click', async () => {
				try {
					if ( await OO.ui.confirm(
						mw.msg(
							`${msgPrefix}.confirm`
						)
					) ) {
						await setting.onClick();
						OO.ui.alert( mw.msg(
							`${msgPrefix}.success`
						) );
					}
				} catch ( e ) {
					OO.ui.alert( mw.msg(
						`${msgPrefix}.failed`
					) );
				}
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
