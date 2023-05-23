import '../../../../types';
import CopiedTemplateEditorDialog from '../CopiedTemplateEditorDialog';

export interface AttributionNoticePageLayout extends OO.ui.PageLayout {

	/**
	 * The parent of this page.
	 */
	parent: ReturnType<typeof CopiedTemplateEditorDialog>;

	/**
	 * Get the children of this page layout. Appended directly after this given
	 * page layout. If the children here also contain children, they MUST already
	 * be in the array, or else they will not be appended.
	 */
	getChildren?: () => AttributionNoticePageLayout[];

}
