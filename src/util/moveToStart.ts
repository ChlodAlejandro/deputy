/**
 * Moves a value as determined by an index of the array to the start of the array.
 * Mutates the original array.
 *
 * @param array The array to use
 * @param index The index of the value to move to the start of the array
 * @return The reordered array.
 */
export default function moveToStart<T>( array: T[], index: number ): T[] {
	const el = array[ index ];
	array.splice( index, 1 );
	array.splice( 0, 0, el );
	return array;
}
