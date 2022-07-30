import CopiedTemplate from './templates/CopiedTemplate';
import { CTEParsoidTransclusionTemplateNode } from './CTEParsoidTransclusionTemplateNode';
import CTEParsoidDocument from './CTEParsoidDocument';
import WikiAttributionNotices, { SupportedAttributionNoticeType } from './WikiAttributionNotices';
import nsId from '../../../util/nsId';
import SplitArticleTemplate from './templates/SplitArticleTemplate';
import MergedFromTemplate from './templates/MergedFromTemplate';

/**
 * Creates blank attribution notices. Its own class to avoid circular dependencies.
 */
export default class TemplateFactory {

	/**
	 * Simply increments when notices are added. This gives specific notices a
	 * human-friendly identifier.
	 */
	static noticeCount = 1;

	/**
	 * Get the template wikitext (`target.wt`) of a given notice type.
	 *
	 * @param type
	 * @return The wikitext of the template's target page
	 */
	private static getTemplateWikitext( type: SupportedAttributionNoticeType ) {
		return WikiAttributionNotices.attributionNoticeTemplates[ type ].getNamespaceId() ===
			nsId( 'template' ) ?
			// If in the "Template" namespace, "Copied"
			WikiAttributionNotices.attributionNoticeTemplates[ type ].getNameText() :
			// If not in the "Template" namespace, "Namespace:Copied"
			WikiAttributionNotices.attributionNoticeTemplates[ type ].getPrefixedText();
	}

	/**
	 * Creates a new {@link CopiedTemplate}
	 *
	 * @param document
	 * @return A new CopiedTemplate
	 */
	static copied( document: CTEParsoidDocument ): CopiedTemplate {
		const templateWikitext = TemplateFactory.getTemplateWikitext( 'copied' );
		const node = CTEParsoidTransclusionTemplateNode.fromNew(
			document,
			templateWikitext,
			{
				// Pre-fill with target page
				to: new mw.Title( document.getPage() ).getSubjectPage().getPrefixedText()
			}
		);
		node.element.setAttribute( 'about', `N${TemplateFactory.noticeCount++}` );
		node.element.classList.add( 'copiednotice' );
		return new CopiedTemplate( node );
	}

	/**
	 * Creates a new {@link SplitArticleTemplate}
	 *
	 * @param document
	 * @return A new SplitArticleTemplate
	 */
	static splitArticle( document: CTEParsoidDocument ): SplitArticleTemplate {
		const templateWikitext = TemplateFactory.getTemplateWikitext( 'splitArticle' );
		const node = CTEParsoidTransclusionTemplateNode.fromNew(
			document,
			templateWikitext,
			{
				from: new mw.Title( document.getPage() ).getSubjectPage().getPrefixedText(),
				// Blank string to trigger row creation
				to: ''
			}
		);
		node.element.setAttribute( 'about', `N${TemplateFactory.noticeCount++}` );
		node.element.classList.add( 'box-split-article' );
		return new SplitArticleTemplate( node );
	}

	/**
	 * Creates a new {@link MergedFromTemplate}
	 *
	 * @param document
	 * @return A new MergedFromTemplate
	 */
	static mergedFrom( document: CTEParsoidDocument ): MergedFromTemplate {
		const templateWikitext = TemplateFactory.getTemplateWikitext( 'mergedFrom' );
		const node = CTEParsoidTransclusionTemplateNode.fromNew(
			document,
			templateWikitext,
			{},
		);
		node.element.setAttribute( 'about', `N${TemplateFactory.noticeCount++}` );
		node.element.classList.add( 'box-merged-from' );
		return new MergedFromTemplate( node );
	}

}
