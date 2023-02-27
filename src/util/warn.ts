/**
 * Log warnings to the console.
 *
 * @param {...any} data
 */
export default function warn( ...data: any[] ) {
	console.warn( '[Deputy]', ...data );
}
