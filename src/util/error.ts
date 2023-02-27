/**
 * Log errors to the console.
 *
 * @param {...any} data
 */
export default function log( ...data: any[] ) {
	console.error( '[Deputy]', ...data );
}
