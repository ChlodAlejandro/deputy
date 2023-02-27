/**
 * Log errors to the console.
 *
 * @param {...any} data
 */
export default function error( ...data: any[] ) {
	console.error( '[Deputy]', ...data );
}
