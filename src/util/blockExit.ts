const exitBlockList: string[] = [];

/**
 * Used to block an impending exit.
 *
 * @param event The unload event
 * @return `false`.
 */
const exitBlock = ( event: BeforeUnloadEvent ): boolean => {
	event.preventDefault();
	return event.returnValue = false;
};

/**
 * Blocks navigation to prevent data loss. This function takes in a
 * `key` parameter to identify which parts of the tool are blocking navigation.
 * The exit block will refuse to unlatch from the document if all keys are not
 * released with `unblockExit`.
 *
 * If no key is provided, this will unconditionally set the block. Running
 * any operation that updates the block list (e.g. `unblockExit` with a key
 * not blocked) will immediately unblock the page.
 *
 * @param key The key of the exit block.
 */
export function blockExit( key?: string ) {
	if ( key ) {
		if ( exitBlockList.indexOf( key ) === -1 ) {
			exitBlockList.push( key );
		}
	}

	window.addEventListener( 'beforeunload', exitBlock );
}

/**
 * Unblocks navigation. This function takes in a `key` parameter to identify
 * which part of the tool is no longer requiring a block. If other parts of
 * the tool still require blocking, the unblock function will remain on the
 * document.
 *
 * If no key is provided, this will dump all keys and immediate unblock exit.
 *
 * @param key The key of the exit block.
 */
export function unblockExit( key?: string ) {
	if ( key ) {
		const keyIndex = exitBlockList.indexOf( key );
		if ( keyIndex !== -1 ) {
			exitBlockList.splice( keyIndex, 1 );
		}
	} else {
		exitBlockList.splice( 0, exitBlockList.length );
	}

	if ( exitBlockList.length === 0 ) {
		window.addEventListener( 'beforeunload', exitBlock );
	}
}
