/**
 *
 * @param objects
 * @param keyer
 */
export default function organize<T>(
	objects: T[],
	keyer: ( pivot: T ) => string
): Record<string, T[]> {
	const finalObj: Record<string, T[]> = {};

	for ( const obj of objects ) {
		const key = keyer( obj );
		if ( !finalObj[ key ] ) {
			finalObj[ key ] = [];
		}
		finalObj[ key ].push( obj );
	}

	return finalObj;
}
