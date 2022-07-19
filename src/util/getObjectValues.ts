/**
 * Works like `Object.values`.
 *
 * @param obj The object to get the values of.
 * @return The values of the given object as an array
 */
export default function getObjectValues( obj: any ): any[] {
	return Object.keys( obj ).map( ( key ) => obj[ key ] );
}
