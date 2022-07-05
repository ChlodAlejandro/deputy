import { ArrayOrNot } from '../types';

/**
 * Mixes values together into a string for the `class` attribute.
 *
 * @param {...any} classes
 * @return string
 */
export default function (
	...classes: ArrayOrNot<string | null | undefined | false>[]
): string {
	const processedClasses = [];

	for ( const _class of classes ) {
		if ( Array.isArray( _class ) ) {
			processedClasses.push( ..._class );
		} else {
			processedClasses.push( _class );
		}
	}

	return processedClasses.filter( ( v ) => v != null && v != false ).join( ' ' );
}
