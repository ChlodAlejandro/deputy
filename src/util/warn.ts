/**
 * Log warnings to the console.
 *
 * @param {...any} data
 */
export default function log( ...data: any[] ) {
	console.warn( '[Deputy]', ...data );
}
