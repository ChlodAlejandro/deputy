/**
 * Works like `Object.fromEntries`
 *
 * @param obj The object to get the values of.
 * @return The values of the given object as an array
 */
export default function fromObjectEntries<T extends string, U>( obj: [T, U][] ): Record<T, U> {
	const i: Partial<Record<T, U>> = {};
	for ( const [ key, value ] of obj ) {
		i[ key ] = value;
	}
	return i as Record<T, U>;
}
