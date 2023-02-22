import CCICaseRequestFiler from './CCICaseRequestFiler';
import Recents from '../../wiki/Recents';

/**
 * This function handles CCRF loading when Deputy isn't present. When Deputy is not
 * present, the following must be done on our own:
 * (1) Instantiate an OOUI WindowManager
 * (2) Load language strings
 *
 * `preInit` handles all of those. This function simply calls it on run.
 *
 * @param window
 */
( async ( window: Window & { CaseRequestFiler?: CCICaseRequestFiler } ) => {

	Recents.save();
	window.CaseRequestFiler = new CCICaseRequestFiler();
	await window.CaseRequestFiler.preInit();

} )( window );
