/**
 * Returns the last item of a NodeList array.
 *
 * @param array The array to get the last element from
 * @return The last element of the array
 */
function last<T extends Node>( array: NodeListOf<T> ): T;
/**
 * Returns the last item of an array.
 *
 * @param array The array to get the last element from
 * @return The last element of the array
 */
function last<T>( array: T[] ): T;
/**
 * Returns the last character of a string.
 *
 * @param string The string to get the last character from
 * @return The last character of the string
 */
function last( string: string ): string;
/**
 * Returns the last item of an array.
 *
 * @param array The array to get the last element from
 * @return The last element of the array
 */
function last( array: any ): any {
	return array[ array.length - 1 ];
}

export default last;
