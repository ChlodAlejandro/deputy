import Archivist from './Archivist';

/**
 * This function handles Archivist loading when Deputy isn't present.
 * When Deputy is not present, the following must be done on our own:
 * (1) Instantiate an OOUI WindowManager
 * (2) Load language strings
 *
 * `preInit` handles all of those. This function simply calls it on run.
 *
 * @param window
 */
( async ( window: Window & { Archivist?: Archivist } ) => {

	window.Archivist = new Archivist();
	await window.Archivist.preInit();

} )( window );
