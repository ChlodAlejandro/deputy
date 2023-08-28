import ParsoidDocument from '@chlodalejandro/parsoid';
import last from '../../../util/last';
import AttributionNotice from './AttributionNotice';
import WikiAttributionNotices, {
	AttributionNoticeTypeClass,
	SupportedAttributionNoticeType
} from './WikiAttributionNotices';
import TemplateInsertEvent from '../events/TemplateInsertEvent';
import { CTEParsoidTransclusionTemplateNode } from './CTEParsoidTransclusionTemplateNode';
import TemplateFactory from './TemplateFactory';
import moveToStart from '../../../util/moveToStart';
import RowedAttributionNotice from './RowedAttributionNotice';
import organize from '../../../util/organize';
import MwApi from '../../../MwApi';
import { parsoidVersion } from '../../../DeputyVersion';

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

			const notices = this.findNoticeType( 'copied' );
			this.originalCount = notices.length;

			if ( this.redirect ) {
				// Move the redirect line out of the way to avoid breaking redirects.
				const p = document.createElement( 'p' );
				const redirect = this.iframe.contentWindow.document
					.querySelector( '[rel="mw:PageProp/Redirect"]' );

				redirect.insertAdjacentElement( 'afterend', p );
				p.appendChild( redirect );
			}
		} );
	}

	/**
	 * @inheritDoc
	 * @protected
	 */
	protected getRequestOptions(): Omit<RequestInit, 'body' | 'cache' | 'method'> {
		const ro = super.getRequestOptions();
		return {
			headers: {
				'Api-User-Agent': `${MwApi.USER_AGENT} ${
					( ro.headers as any )?.[ 'Api-User-Agent' ] ?? ''
				}`
			}
		};
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
			const node of this.findTemplate( WikiAttributionNotices.templateAliasRegExp, true )
		) {
			if ( !this.notices.has( node.element ) ) {
				// Notice not yet cached, but this is an attribution notice.
				// Now to determine what type.
				const type = WikiAttributionNotices.getTemplateNoticeType(
					node.getTarget().href
				);

				const noticeInstance = new (
					WikiAttributionNotices.attributionNoticeClasses[ type ]
				)( CTEParsoidTransclusionTemplateNode.upgradeNode( node, this ) );
				this.notices.set( node.element, noticeInstance );
			}

			notices.push( this.notices.get( node.element ) );
		}

		return notices;
	}

	/**
	 * Find all notices which have rows using their 'href' fields.
	 *
	 * @return All found {@link RowedAttributionNotice}s
	 */
	findRowedNoticesByHref(): Record<string, RowedAttributionNotice<any>[]> {
		return organize(
			this.findNotices().filter(
				v => v instanceof RowedAttributionNotice
			) as RowedAttributionNotice<any>[],
			( v ) => v.node.getTarget().href
		);
	}

	/**
	 * Finds this document's {{copied}} notices.
	 *
	 * @param type
	 * @return An array of all CopiedTemplate objects found
	 */
	findNoticeType<T extends SupportedAttributionNoticeType>(
		type: T
	): AttributionNoticeTypeClass<T>[] {
		return this.findNotices().filter(
			( notice ) => notice instanceof
				WikiAttributionNotices.attributionNoticeClasses[ type ]
		) as AttributionNoticeTypeClass<T>[];
	}

	/**
	 * Look for a good spot to place a {{copied}} template.
	 *
	 * @param type The type of the notice to look a spot for.
	 * @return A spot to place the template, `null` if a spot could not be found.
	 */
	findNoticeSpot(
		type: SupportedAttributionNoticeType
	): [InsertPosition, HTMLElement|null] {
		// TODO: Just use a simple "if" for {{translated page}}.
		const positionIndices: Record<SupportedAttributionNoticeType, number> = {
			copied: 0,
			splitArticle: 1,
			mergedFrom: 2,
			mergedTo: 3,
			backwardsCopy: 4,
			translatedPage: 5
		};
		const positionIndex = positionIndices[ type ];
		const variableSpots: [InsertPosition, HTMLElement|null][] = [
			[
				positionIndex >= positionIndices.copied ? 'afterend' : 'beforebegin',
				positionIndex >= positionIndices.copied ?
					last( this.document.querySelectorAll( '.copiednotice' ) ) :
					this.document.querySelector( '.copiednotice' )
			],
			[
				positionIndex >= positionIndices.splitArticle ? 'afterend' : 'beforebegin',
				positionIndex >= positionIndices.splitArticle ?
					last( this.document.querySelectorAll( '.box-split-article' ) ) :
					this.document.querySelector( '.box-split-article' )
			],
			[
				positionIndex >= positionIndices.mergedFrom ? 'afterend' : 'beforebegin',
				positionIndex >= positionIndices.mergedFrom ?
					last( this.document.querySelectorAll( '.box-merged-from' ) ) :
					this.document.querySelector( '.box-merged-from' )
			],
			[
				positionIndex >= positionIndices.mergedTo ? 'afterend' : 'beforebegin',
				positionIndex >= positionIndices.mergedTo ?
					last( this.document.querySelectorAll( '.box-merged-to' ) ) :
					this.document.querySelector( '.box-merged-to' )
			],
			[
				positionIndex >= positionIndices.backwardsCopy ? 'afterend' : 'beforebegin',
				positionIndex >= positionIndices.backwardsCopy ?
					last( this.document.querySelectorAll( '.box-backwards-copy' ) ) :
					this.document.querySelector( '.box-backwards-copy' )
			],
			[
				positionIndex >= positionIndices.translatedPage ? 'afterend' : 'beforebegin',
				positionIndex >= positionIndices.translatedPage ?
					last( this.document.querySelectorAll( '.box-translated-page' ) ) :
					this.document.querySelector( '.box-translated-page' )
			]
		];

		// Move everything after the template type we're looking for to the start of the array.
		// Also place the exact type we're looking for at the top of the array.
		// This prioritizes the highest (by position) template in the page.
		const afterSpots = variableSpots.splice(
			positionIndex + 1,
			variableSpots.length - positionIndex + 1
		);
		const beforeSpots = variableSpots.splice(
			0,
			positionIndex
		).reverse();
		moveToStart( variableSpots, 0 );
		variableSpots.push( ...beforeSpots, ...afterSpots );

		const possibleSpots: [InsertPosition, HTMLElement|null][] = [
			...variableSpots,
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
			[ 'afterend', last( this.document.querySelectorAll( '.wpb' ) ) ],
			// After the last talk page message box that is not a small box
			[ 'afterend', last( this.document.querySelectorAll(
				'[data-mw-section-id="0"] .tmbox:not(.mbox-small):not(.talkheader)'
			) ) ],
			// After the talk page header
			[ 'afterend', this.document.querySelector( '.talkheader' ) ],
			// After the rcat shell
			[ 'afterend', this.document.querySelector( '.box-Redirect_category_shell' ) ],
			// After rcats
			[ 'afterend', last( this.document.querySelectorAll( '.rcat' ) ) ],
			// After the #REDIRECT line
			[ 'afterend', this.document.querySelector(
				'[rel="mw:PageProp/redirect"]'
			)?.parentElement ],
			// At the start of the talk page
			[ 'afterbegin', this.document.querySelector( 'section[data-mw-section-id="0"]' ) ]
		];

		for ( const spot of possibleSpots ) {
			if ( spot[ 1 ] != null ) {
				if (
					spot[ 1 ].hasAttribute( 'data-mw' ) ||
					( !spot[ 1 ].getAttribute( 'about' ) &&
					!spot[ 1 ].getAttribute( 'id' ) )
				) {
					return spot;
				} else {
					const identifier = (
						spot[ 1 ].getAttribute( 'about' ) ??
						spot[ 1 ].getAttribute( 'id' )
					).replace( /^#/, '' );

					// Find the last element from that specific transclusion.
					const transclusionRoot = last(
						this.document.querySelectorAll(
							`#${identifier}, [about="#${identifier}"]`
						)
					);

					return [
						spot[ 0 ],
						transclusionRoot as HTMLElement
					];
				}
			}
		}
		return null;
	}

	/**
	 * Inserts a new attribution notice of a given type.
	 *
	 * @param type A notice type
	 * @param spot The spot to place the template.
	 * @param spot."0" See {@link CTEParsoidDocument.findNoticeSpot()}[0]
	 * @param spot."1" See {@link CTEParsoidDocument.findNoticeSpot()}[1]
	 */
	insertNewNotice(
		type: SupportedAttributionNoticeType,
		[ position, element ]: [ InsertPosition, Element ]
	) {
		const template = ( <Record<
			SupportedAttributionNoticeType, ( document: CTEParsoidDocument ) => AttributionNotice>
		>{
			copied: TemplateFactory.copied,
			splitArticle: TemplateFactory.splitArticle,
			mergedFrom: TemplateFactory.mergedFrom,
			mergedTo: TemplateFactory.mergedTo,
			backwardsCopy: TemplateFactory.backwardsCopy,
			translatedPage: TemplateFactory.translatedPage
		} )[ type ]( this );

		// Insert.
		element.insertAdjacentElement( position, template.element );
		this.notices.set( template.element, template );
		this.dispatchEvent( new TemplateInsertEvent( template ) );
	}
}
