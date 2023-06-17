import CopiedTemplateEditor from './CopiedTemplateEditor';
import Recents from '../../wiki/Recents';
import DeputyAnnouncements from '../../DeputyAnnouncements';

/**
 * This function handles CTE loading when Deputy isn't present. When Deputy is not
 * present, the following must be done on our own:
 * (1) Instantiate an OOUI WindowManager
 * (2) Load language strings
 *
 * `preInit` handles all of those. This function simply calls it on run.
 *
 * @param window
 */
( async ( window: Window & { CopiedTemplateEditor?: CopiedTemplateEditor } ) => {

	Recents.save();
	window.CopiedTemplateEditor = new CopiedTemplateEditor();
	await window.CopiedTemplateEditor.preInit();
	await DeputyAnnouncements.init( window.CopiedTemplateEditor.config );

} )( window );
