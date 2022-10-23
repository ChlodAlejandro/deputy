import yesNo from './yesNo';

type CleanParamsOption<T> = keyof T | ( keyof T )[] | boolean;
/**
 * Options for the cleanParams function.
 */
interface CleanParamsOptions<T extends Record<string, string>> {
	/**
	 * Options for filtering `null`/`undefined`/empty string parameters.
	 * - Passing `true` will remove all parameters that are null or empty.
	 * - Passing a string will remove the parameter with that key if it is null or empty.
	 * - Passing a string array will remove parameters with keys in the array that are
	 *   null or empty.
	 */
	filter: CleanParamsOption<T>;
	/**
	 * Options for trimming parameters.
	 * - Passing `true` will trim all parameters.
	 * - Passing a string will trim only the parameter with that key.
	 * - Passing a string array will trim all parameters with keys in the array.
	 *
	 * If a parameter cannot be trimmed (no trim function, is null or undefined, etc.),
	 * this operation silently fails.
	 */
	trim: CleanParamsOption<T>;
	/**
	 * Options for removing values with yes-like values.
	 * - Passing `true` will remove all parameters with yes-like values.
	 * - Passing a string will remove the parameter with that key if it has a yes-like value.
	 * - Passing a string array will remove all parameters in that array if it has a yes-like value.
	 */
	removeYes?: CleanParamsOption<T>;
	/**
	 * Options for removing values with no-like values.
	 * - Passing `true` will remove all parameters with no-like values.
	 * - Passing a string will remove the parameter with that key if it has a no-like value.
	 * - Passing a string array will remove all parameters in that array if it has a no-like value.
	 */
	removeNo?: CleanParamsOption<T>;
	/**
	 * A second pass of `null`/`undefined`/empty string removal is run after all
	 * other cleaning operations. This ensures no empty parameters are left behind.
	 * If `filter` is supplied, it will be used for this value. If set to `false`, no
	 * second pass will be performed.
	 */
	filter2?: CleanParamsOption<T>;
}

/**
 * Runs a clean operation. If `option` is false or null, the operation will not be run.
 *
 * @param obj
 * @param option
 * @param callback
 */
function onOption<
	T extends Record<string, string>,
	U extends( v: string ) => string | undefined
>(
	obj: T,
	option: false | null | undefined | CleanParamsOption<T>,
	callback: U
): void {
	if ( option == null || option === false ) {
		return;
	}

	for ( const key of ( Object.keys( obj ) as ( keyof typeof obj )[] ) ) {
		if (
			option === true ||
			option === ( key as keyof typeof obj ) ||
			( Array.isArray( option ) && option.indexOf( key ) !== -1 )
		) {
			const result = callback( obj[ key ] );
			if ( result === undefined ) {
				delete obj[ key ];
			} else {
				obj[ key ] = ( result as typeof obj[keyof typeof obj] );
			}
		}
	}
}

/**
 * Cleans a parameter list. By default, this performs the following:
 * - Removes all undefined, null, or empty values
 * - Trims all strings
 * - Removes newly undefined, null, or empty values
 *
 * This mutates the original object and also returns it for chaining.
 *
 * @param obj
 * @param _options
 * @return The cleaned parameter list.
 */
export default function cleanParams<T extends Record<string, string>>(
	obj: T, _options: Partial<CleanParamsOptions<T>> = {}
): Partial<T> {
	const defaultOptions: Required<CleanParamsOptions<T>> = {
		trim: true,
		filter: true,
		removeYes: false,
		removeNo: false,
		filter2: true
	};
	const options = Object.assign( {}, defaultOptions, _options );

	// First clean pass
	onOption(
		obj,
		options.filter,
		( v ) => !v || v.length === 0 ? undefined : v
	);

	onOption(
		obj,
		options.trim,
		( v ) => v.trim ? v.trim() : v
	);

	onOption(
		obj,
		options.removeYes,
		( v ) => yesNo( v, false ) ? undefined : v
	);

	onOption(
		obj,
		options.removeNo,
		( v ) => yesNo( v, true ) ? undefined : v
	);

	// Second clean pass
	onOption(
		obj,
		options.filter,
		( v ) => !v || v.length === 0 ? undefined : v
	);

	return obj;
}
