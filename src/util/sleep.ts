/**
 * Sleep for an specified amount of time.
 *
 * @param ms Milliseconds to sleep for.
 */
export default async function sleep( ms: number ): Promise<void> {
	return new Promise<void>( ( res ) => {
		setTimeout( res, ms );
	} );
}
