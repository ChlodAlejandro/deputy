/**
 * Performs {{yesno}}-based string interpretation.
 *
 * @param value The value to check
 * @param pull Depends which direction to pull unspecified values.
 * @return If `pull` is true,
 * any value that isn't explicitly a negative value will return `true`. Otherwise,
 * any value that isn't explicitly a positive value will return `false`.
 */
export default function ( value: string|number|boolean, pull = true ): boolean {
	if ( pull ) {
		return value !== false &&
			value !== 'no' &&
			value !== 'n' &&
			value !== 'false' &&
			value !== 'f' &&
			value !== 'off' &&
			+value !== 0;
	} else {
		return !( value !== true &&
			value !== 'yes' &&
			value !== 'y' &&
			value !== 't' &&
			value !== 'true' &&
			value !== 'on' &&
			+value !== 1 );
	}
}
