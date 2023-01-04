/**
 * Iterates over an array and returns an Iterator which checks each element
 * of the array sequentially for a given condition (predicated by `condition`)
 * and returns another array, containing an element where `true` was returned,
 * and every subsequent element where the check returns `false`.
 *
 * @param arr
 * @param condition
 * @yield The found sequence
 */
export default function* pickSequence<T>(
	arr: T[],
	condition: ( val: T ) => boolean
): Iterable<T[]> {
	let currentValues: T[] = null;
	let shouldReturnValues = false;
	for ( const val of arr ) {
		if ( condition( val ) ) {
			shouldReturnValues = true;
			if ( currentValues != null ) {
				yield currentValues;
			}
			currentValues = [ val ];
			continue;
		}
		if ( shouldReturnValues ) {
			currentValues.push( val );
		}
	}
	if ( currentValues.length > 0 ) {
		yield currentValues;
	}
}
