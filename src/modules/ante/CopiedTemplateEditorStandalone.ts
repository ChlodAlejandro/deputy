import CopiedTemplateEditor from './CopiedTemplateEditor';

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

	window.CopiedTemplateEditor = new CopiedTemplateEditor();
	await window.CopiedTemplateEditor.preInit();

} )( window );
