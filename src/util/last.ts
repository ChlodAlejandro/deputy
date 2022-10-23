// These don't recognize TypeScript multiple definitions.
/* eslint-disable jsdoc/require-returns-check */
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
 * Returns the last item of an array.
 *
 * @param array The array to get the last element from
 * @return The last element of the array
 */
function last( array: any ): any {
	return array[ array.length - 1 ];
}

export default last;
