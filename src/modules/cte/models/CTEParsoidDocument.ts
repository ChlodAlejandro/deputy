import ParsoidDocument from '@chlodalejandro/parsoid';
import last from '../../../util/last';
import CopiedTemplate from './CopiedTemplate';

/**
 * An object containing an {@link HTMLIFrameElement} along with helper functions
 * to make manipulation easier.
 */
export default class CTEParsoidDocument extends ParsoidDocument {

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
	 * Aliases of the {{copied}} template. This must be in lowercase and all
	 * spaces must be replaced with underscores.
	 */
	static readonly copiedTemplateAliases = <const>[
		'template:copied',
		'template:copied_from',
		'template:copywithin'
	];

	/**
	 * A list of {{copied}} notices in the document.
	 *
	 * @type {CopiedTemplate[]}
	 */
	copiedNotices: CopiedTemplate[];
	/**
	 * The original number of {{copied}} notices in the document.
	 */
	originalNoticeCount: number;

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

			this.findCopiedNotices();
			this.originalNoticeCount = this.copiedNotices.length;
		} );
	}

	/**
	 * Finds this document's {{copied}} notices.
	 */
	findCopiedNotices() {
		this.copiedNotices = [];

		for ( const templateElement of this.findTemplate( /c/gi ) ) {
			// This is a copied template.
			const notice = new CopiedTemplate(
				this,
				templateElement.originalElement,
				templateElement.i
			);
			this.copiedNotices.push(
				notice
			);
			notice.addEventListener( 'destroy', () => {
				const i = this.copiedNotices.indexOf( notice );
				this.copiedNotices.splice( i, 1 );
			} );
		}
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
		this.dispatchEvent( new Event( 'insert' ) );
	}
}
