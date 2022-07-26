import ParsoidDocument from '@chlodalejandro/parsoid';
import last from '../../../util/last';
import AttributionNotice from './AttributionNotice';
import WikiAttributionNotices from './WikiAttributionNotices';
import CopiedTemplate from './CopiedTemplate';

/**
 * An event dispatched when a template inside a `CopiedTemplateEditorDialog` is inserted.
 */
export class TemplateInsertEvent extends Event {

	template: AttributionNotice;

	/**
	 * @param template The template that was inserted
	 * @param eventInitDict
	 */
	constructor( template: AttributionNotice, eventInitDict?: EventInit ) {
		super( 'templateInsert', eventInitDict );
		this.template = template;
	}

}

/**
 * Extension class of ParsoidDocument's node. Used to type `parsoidDocument` in the
 * below function. Since the original node is always instantiated with `this`, it
 * can be assumed that `parsoidDocument` is a valid CTEParsoidDocument.
 */
export class CTEParsoidTransclusionTemplateNode extends ParsoidDocument.Node {

	/**
	 * Upgrades a vanilla ParsoidDocument.Node to a CTEParsoidTransclusionTemplateNode.
	 *
	 * @param node The node to upgrade
	 * @param document The document to attach
	 * @return A CTEParsoidTransclusionTemplateNode
	 */
	static upgradeNode(
		node: InstanceType<typeof ParsoidDocument.Node>,
		document: CTEParsoidDocument
	) {
		return new CTEParsoidTransclusionTemplateNode(
			document, node.originalElement, node.data, node.i, node.autosave
		);
	}

	parsoidDocument: CTEParsoidDocument;
}

/**
 * An object containing an {@link HTMLIFrameElement} along with helper functions
 * to make manipulation easier.
 */
export default class CTEParsoidDocument extends ParsoidDocument {
	static readonly Node: typeof CTEParsoidTransclusionTemplateNode;

	static addedRows = 1;
	/**
	 * Extremely minimalist valid Parsoid document. This includes a section 0
	 * element for findCopiedNoticeSpot.
	 *
	 * @type {string}
	 */
	static readonly defaultDocument =
		'<html><body><section data-mw-section-id="0"></section></body></html>';

	/**
	 * A map of all Parsoid HTML elements and their attribution notices. When notices are
	 * detected, they are added here. ParsoidTemplateTransclusionNode is not used here
	 * since they are regenerated every time `findTemplate` is called.
	 */
	notices: Map<HTMLElement, AttributionNotice> = new Map();
	/**
	 * The original number of {{copied}} notices in the document.
	 */
	originalCount: number = null;

	/**
	 * Creates a new CTE-specific ParsoidDocument. This extends from the existing
	 * ParsoidDocument with functions specifically catered for pages that have
	 * {{copied}} (or will have) templates.
	 */
	constructor() {
		super();

		// Event listeners should be fired synchronously. Load listener found in
		// `super` should have been run by this point.
		this.iframe.addEventListener( 'load', () => {
			if ( this.iframe.contentWindow.document.URL === 'about:blank' ) {
				// Blank document loaded. Ignore.
				return;
			}

			const notices = this.findCopiedNotices();
			this.originalCount = notices.length;
		} );
	}

	/**
	 * @inheritDoc
	 */
	reset() {
		super.reset();
		this.originalCount = undefined;
		this.notices.clear();
	}

	/**
	 * Finds all content attribution notices in the talk page. This includes {{copied}},
	 * {{merged to}}, {{merged from}}, etc.
	 *
	 * @return An array of AttributionNotice objects.
	 */
	findNotices(): AttributionNotice[] {
		this.buildIndex();
		// Used instead of `this.notices.values()` to exclude nodes that are no longer on the DOM.
		const notices: AttributionNotice[] = [];

		for (
			const node of this.findTemplate( WikiAttributionNotices.templateAliasRegExp )
		) {
			if ( !this.notices.has( node.originalElement ) ) {
				// Notice not yet cached, but this is an attribution notice.
				// Now to determine what type.
				const type = WikiAttributionNotices.getTemplateNoticeType(
					node.getTarget().href
				);

				const noticeInstance = new (
					WikiAttributionNotices.attributionNoticeClasses[ type ]
				)( CTEParsoidTransclusionTemplateNode.upgradeNode( node, this ) );
				this.notices.set( node.originalElement, noticeInstance );
			}

			notices.push( this.notices.get( node.originalElement ) );
		}

		return notices;
	}

	/**
	 * Finds this document's {{copied}} notices.
	 *
	 * @return An array of all CopiedTemplate objects found
	 */
	findCopiedNotices(): CopiedTemplate[] {
		return this.findNotices().filter(
			( notice ) => notice instanceof
				WikiAttributionNotices.attributionNoticeClasses.copied
		) as CopiedTemplate[];
	}

	/**
	 * Look for a good spot to place a {{copied}} template.
	 *
	 * @return A spot to place the template, `null` if a spot could not be found.
	 */
	findCopiedNoticeSpot(): [InsertPosition, HTMLElement|null] {
		const possibleSpots: [InsertPosition, HTMLElement|null][] = [
			// After an existing {{copied}} notice
			[ 'afterend', last( this.document.querySelectorAll( '.copiednotice[data-mw]' ) ) ],
			// After the {{to do}} template
			[ 'afterend', last( this.document.querySelectorAll( '.t-todo' ) ) ],
			// After the WikiProject banner shell
			[ 'afterend', this.document.querySelector( '.wpbs' ) ? last(
				this.document.querySelectorAll( `[about="${
					this.document.querySelector( '.wpbs' )
						.getAttribute( 'about' )
				}"]` )
			) : null ],
			// After all WikiProject banners
			[ 'afterend', last( this.document.querySelectorAll( '.wpb[data-mw]' ) ) ],
			// After the last talk page message box that is not a small box
			[ 'afterend', last( this.document.querySelectorAll(
				// eslint-disable-next-line max-len
				'[data-mw-section-id="0"] .tmbox[data-mw]:not(.mbox-small):not(.talkheader[data-mw])'
			) ) ],
			// After the talk page header
			[ 'afterend', this.document.querySelector( '.talkheader[data-mw]' ) ],
			// At the start of the talk page
			[ 'afterbegin', this.document.querySelector( 'section[data-mw-section-id="0"]' ) ]
		];

		for ( const spot of possibleSpots ) {
			if ( spot[ 1 ] != null ) {
				return spot;
			}
		}
		return null;
	}

	/**
	 * Inserts a new {{copied}} template.
	 *
	 * @param spot The spot to place the template.
	 */
	insertNewNotice( spot: [InsertPosition, Element] ) {
		const position = spot[ 0 ];
		let element = spot[ 1 ];

		// If the element was inside a template, get the last element of that template instead.
		if (
			element.hasAttribute( 'about' ) &&
			element.getAttribute( 'about' ).startsWith( '#mwt' )
		) {
			const transclusionSet = this.document.querySelectorAll(
				`[about="${element.getAttribute( 'about' )}"]`
			);
			element = transclusionSet.item( transclusionSet.length - 1 );
		}

		const template = document.createElement( 'span' );
		template.setAttribute( 'about', `N${CTEParsoidDocument.addedRows++}` );
		template.setAttribute( 'typeof', 'mw:Transclusion' );
		template.setAttribute( 'data-mw', JSON.stringify( {
			parts: [ {
				template: {
					target: { wt: 'copied\n', href: './Template:Copied' },
					params: {
						to: {
							wt: new mw.Title( this.page ).getSubjectPage().getPrefixedText()
						}
					},
					i: 0
				}
			} ]
		} ) );

		// Insert.
		element.insertAdjacentElement( position, template );
		this.findCopiedNotices();
		const templateObject = this.notices.get( template );
		this.dispatchEvent( new TemplateInsertEvent( templateObject ) );
	}
}
