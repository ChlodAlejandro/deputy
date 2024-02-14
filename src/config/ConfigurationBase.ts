import Setting from './Setting';
import { PromiseOrNot } from '../types';
import { ConfigurationType } from './Configuration';

/**
 * A configuration. Defines settings and setting groups.
 */
export default abstract class ConfigurationBase {

	// eslint-disable-next-line jsdoc/require-returns-check
	/**
	 * @return the configuration from the current wiki.
	 */
	static load(): PromiseOrNot<ConfigurationBase> {
		throw new Error( 'Unimplemented method.' );
	}

	abstract readonly type: ConfigurationType;
	abstract readonly all: Record<string, Record<string, Setting<any, any>>>;

	/**
	 * Creates a new Configuration.
	 */
	protected constructor() { /* ignored */ }

	/**
	 * Saves the configuration.
	 */
	abstract save(): Promise<void>;

	/**
	 * Deserializes a JSON configuration into this configuration. This WILL overwrite
	 * past settings.
	 *
	 * @param serializedData
	 */
	deserialize( serializedData: any ): void {
		for ( const group in this.all ) {
			const groupObject = this.all[ group as keyof typeof this.all ];
			for ( const key in this.all[ group as keyof ConfigurationBase['all'] ] ) {
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
			for ( const key in this.all[ group as keyof ConfigurationBase['all'] ] ) {
				const setting: Setting<any, any> = groupObject[ key as keyof typeof groupObject ];

				if ( setting.get() === setting.defaultValue && !setting.alwaysSave ) {
					continue;
				}

				const serialized = setting.serialize ?
					// Type-checked upon declaration, just trust it to skip errors.
					( setting.serialize as any )( setting.get() ) : setting.get();
				if ( serialized !== undefined ) {
					groupConfig[ key ] = serialized;
				}
			}

			if ( Object.keys( groupConfig ).length > 0 ) {
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
