import CTEParsoidDocument, { CTEParsoidTransclusionTemplateNode } from './CTEParsoidDocument';
import { MediaWikiData, TemplateData, TemplateDataModifier } from './MediaWikiData';
import { AttributionNoticePageLayout } from '../ui/pages/AttributionNoticePageLayout';
import { AttributionNoticePageGenerator } from '../ui/pages/AttributionNoticePageGenerator';

/**
 * The AttributionNotice abstract class serves as the blueprint for other
 * subclasses that are instances of AttributionNotices (e.g {@link CopiedTemplate}).
 * It provides the basic functionality for the processing of attribution notices.
 */
export default abstract class AttributionNotice
	extends EventTarget implements AttributionNoticePageGenerator {

	/**
	 * The template transclusion node that serves as a reference to an
	 * element on the Parsoid DOM.
	 */
	readonly node: CTEParsoidTransclusionTemplateNode;
	/**
	 * A unique name for this template.
	 */
	readonly name: string;

	/**
	 * @return The ParsoidDocument handling this notice (specifically its node).
	 */
	get parsoid(): CTEParsoidDocument {
		return this.node.parsoidDocument;
	}
	/**
	 * @return The HTMLElement of the node
	 */
	get element(): HTMLElement {
		return this.node.originalElement;
	}

	/**
	 * @return This template's `i` variable, used to identify this template in
	 * the template's `parts` (`data-mw`).
	 */
	get i(): number {
		return this.node.i;
	}

	/**
	 * Super constructor for AttributionNotice subclasses.
	 *
	 * @param node
	 *        The ParsoidTransclusionTemplateNode of this notice.
	 */
	constructor( node: CTEParsoidTransclusionTemplateNode ) {
		super();
		this.node = node;
		this.name = this.element.getAttribute( 'about' )
			.replace( /^#mwt/, '' ) + '-' + this.i;
		this.parse();
	}

	/**
	 * Provides low-level access to a template's `data-mw` entry. When possible,
	 * use functions from `.node` instead, as these are much more stable.
	 *
	 * @param callback The callback for data-modifying operations.
	 */
	accessTemplateData( callback: TemplateDataModifier ) {
		const jsonData: MediaWikiData = JSON.parse(
			this.element.getAttribute( 'data-mw' )
		);

		let templateData: TemplateData;
		let index: number;
		jsonData.parts.forEach(
			( v, k ) => {
				if ( v != null && v.template !== undefined && v.template.i === this.i ) {
					templateData = v;
					index = k;
				}
			}
		);
		if ( templateData === undefined ) {
			throw new TypeError( 'Invalid `i` given to template.' );
		}

		templateData = callback( templateData );

		if ( templateData === undefined ) {
			jsonData.parts.splice( index, 1 );
		} else {
			jsonData.parts[ index ] = templateData;
		}

		this.element.setAttribute(
			'data-mw',
			JSON.stringify( jsonData )
		);

		if ( jsonData.parts.length === 0 ) {
			this.parsoid.getDocument().querySelectorAll( `[about="${
				this.element.getAttribute( 'about' )
			}"]` ).forEach( ( e ) => {
				e.parentElement.removeChild( e );
			} );
		}
	}

	/**
	 * Extracts the parameters from this notice and stores them in the object.
	 *
	 * This should be implemented by subclasses.
	 */
	abstract parse(): void;

	/**
	 * Save the existing template parameters into the Parsoid element for this notice.
	 */
	abstract save(): void;

	/**
	 * Destroys the notice by removing it from the Parsoid document. Optionally, a
	 * subclass can mark itself as destroyed or wipe its values.
	 */
	abstract destroy(): void;

	/**
	 * Generates an OOUI PageLayout for this notice. Used by the main dialog to generate
	 * pages. **Do not cache** - the dialog is responsible for caching.
	 */
	abstract generatePage( dialog: /* CopiedTemplateEditorDialog */ any ):
		AttributionNoticePageLayout;

	/**
	 * Gets a wikitext string representation of this template. Used for
	 * previews.
	 */
	abstract toWikitext(): string;

	/**
	 * Converts this notice to parsed HTML.
	 *
	 * @return {Promise<string>}
	 */
	async generatePreview() {
		return new mw.Api().post( {
			action: 'parse',
			format: 'json',
			formatversion: '2',
			utf8: 1,
			title: this.parsoid.getPage(),
			text: this.toWikitext()
		} ).then( ( data ) => data.parse.text );
	}

}
