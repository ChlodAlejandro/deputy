import { AttributionNoticePageLayout } from './pages/AttributionNoticePageLayout';

export interface AttributionNoticePageGenerator {

	/**
	 * Generates an OOUI PageLayout for this notice. Used by the main dialog to generate
	 * pages. **Do not cache** - the dialog is responsible for caching.
	 */
	generatePage( dialog: /* CopiedTemplateEditorDialog */ any ):
		AttributionNoticePageLayout;

}
