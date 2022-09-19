import fromObjectEntries from '../util/fromObjectEntries';
import { DisplayOptions } from './Setting';

/**
 * Generates configuration properties for serialized <b>string</b> enums.
 *
 * Trying to use anything that isn't a string enum here (union enum, numeral enum)
 * will likely cause serialization/deserialization failures.
 *
 * @param _enum
 * @param defaultValue
 * @return Setting properties.
 */
export function generateEnumConfigurationProperties<T>(
	_enum: T,
	defaultValue?: T[keyof T],
) {
	return {
		serialize: ( value: typeof _enum[keyof typeof _enum] ) =>
			value === defaultValue ? undefined : value,
		deserialize: ( value: any ) =>
			value as typeof _enum[keyof typeof _enum],
		displayOptions: <DisplayOptions>{
			type: 'radio'
		},
		allowedValues: fromObjectEntries(
			Array.from( new Set( Object.keys( _enum ) ).values() )
				.map( ( v ) => [ v, ( _enum as any )[ v ] ] )
		),
		defaultValue: defaultValue
	};
}

export enum PortletNameView {
	Full = 'full',
	Short = 'short',
	Acronym = 'acronym'
}
