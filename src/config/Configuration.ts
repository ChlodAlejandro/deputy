import Setting from './Setting';
import DeputyVersion from '../DeputyVersion';
import MwApi from '../MwApi';
import { CopyrightProblemsResponseSet } from '../modules/ia/models/CopyrightProblemsResponse';
import { generateEnumConfigurationProperties, PortletNameView } from './types';
import { CompletionAction } from '../modules/shared/CompletionAction';
import { EnumValue } from '../types';

/**
 * A configuration. Defines settings and setting groups.
 */
export default class Configuration {

	static readonly configVersion = 1;
	static readonly optionKey = 'userjs-deputy';

	/**
	 * @return the configuration from the current wiki.
	 */
	static load(): Configuration {
		const config = new Configuration();
		config.deserialize(
			mw.user.options.get( Configuration.optionKey )
		);
		return config;
	}

	public readonly core = <const>{
		/**
		 * The last version Deputy was loaded with.
		 */
		lastVersion: new Setting<string, string>( {
			defaultValue: DeputyVersion,
			displayOptions: { hidden: true }
		} ),
		/**
		 * Numerical code that identifies this config version. Increments for every breaking
		 * configuration file change.
		 */
		configVersion: new Setting<number, number>( {
			defaultValue: Configuration.configVersion,
			displayOptions: { hidden: true }
		} ),
		language: new Setting<string, string>( {
			defaultValue: 'en'
		} ),
		modules: new Setting<string[], string[]>( {
			defaultValue: [ 'cci', 'ante', 'ia' ]
		} ),
		portletNames: new Setting<
			EnumValue<typeof PortletNameView>,
			PortletNameView
		>(
			generateEnumConfigurationProperties( PortletNameView, PortletNameView.Full )
		)
	};
	public readonly cci = <const>{
		enablePageToolbar: new Setting<boolean, boolean>( {
			defaultValue: true,
			displayOptions: {
				disabled: 'unimplemented'
			}
		} )
	};
	public readonly ante = <const>{
		enableAutoMerge: new Setting<boolean, boolean>( {
			defaultValue: false
		} ),
		onSubmit: new Setting<
			EnumValue<typeof CompletionAction>,
			CompletionAction
		>(
			generateEnumConfigurationProperties( CompletionAction, CompletionAction.Reload )
		)
	};
	public readonly ia = <const>{
		responses: new Setting<
			CopyrightProblemsResponseSet, CopyrightProblemsResponseSet
		>( {
			...Setting.basicSerializers,
			defaultValue: null
		} ),
		enablePageToolbar: new Setting<boolean, boolean>( {
			defaultValue: true,
			displayOptions: {
				disabled: 'unimplemented'
			}
		} ),
		defaultEntirePage: new Setting<boolean, boolean>( {
			defaultValue: true
		} ),
		defaultFromUrls: new Setting<boolean, boolean>( {
			defaultValue: true
		} ),
		onHide: new Setting<
			EnumValue<typeof CompletionAction>,
			CompletionAction
		>( generateEnumConfigurationProperties( CompletionAction, CompletionAction.Reload ) ),
		onSubmit: new Setting<
			EnumValue<typeof CompletionAction>,
			CompletionAction
		>( generateEnumConfigurationProperties( CompletionAction, CompletionAction.Reload ) )
	};

	public readonly all = { core: this.core, cci: this.cci, ante: this.ante, ia: this.ia };

	/**
	 * Creates a new Configuration.
	 *
	 * @param serializedData
	 */
	constructor( serializedData: any = {} ) {
		if ( serializedData ) {
			this.deserialize( serializedData );
		}
	}

	/**
	 * Saves the configuration.
	 */
	async save(): Promise<void> {
		await MwApi.action.saveOption( Configuration.optionKey, this.serialize() );
	}

	/**
	 * Deserializes a JSON configuration into this configuration. This WILL overwrite
	 * past settings.
	 *
	 * @param serializedData
	 */
	deserialize( serializedData: any ): void {
		for ( const group in this.all ) {
			const groupObject = this.all[ group as keyof typeof this.all ];
			for ( const key in this.all[ group as keyof Configuration['all'] ] ) {
				const setting: Setting<any, any> = groupObject[ key as keyof typeof groupObject ];
				if ( serializedData?.[ group ]?.[ key ] !== undefined ) {
					setting.set( setting.deserialize ?
						// Type-checked upon declaration, just trust it to skip errors.
						( setting.deserialize as any )( serializedData[ group ][ key ] ) :
						serializedData[ group ][ key ]
					);
				}
			}
		}
	}

	/**
	 * @return the serialized version of the configuration. All `undefined` values are stripped
	 * from output. If a category remains unchanged from defaults, it is skipped. If the entire
	 * configuration remains unchanged, `null` is returned.
	 */
	serialize(): any {
		const config: Record<any, any> = {};
		for ( const group of Object.keys( this.all ) ) {
			const groupConfig: Record<any, any> = {};
			const groupObject = this.all[ group as keyof typeof this.all ];
			for ( const key in this.all[ group as keyof Configuration['all'] ] ) {
				const setting: Setting<any, any> = groupObject[ key as keyof typeof groupObject ];
				const serialized = setting.serialize ?
					// Type-checked upon declaration, just trust it to skip errors.
					( setting.serialize as any )( setting.get() ) : setting.get();
				if ( serialized !== undefined ) {
					groupConfig[ key ] = serialized;
				}
			}

			if ( Object.keys( group ).length > 0 ) {
				config[ group ] = groupConfig;
			}
		}

		if ( Object.keys( config ).length > 0 ) {
			return config;
		} else {
			return null;
		}
	}

}
