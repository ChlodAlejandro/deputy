import normalizeTitle from '../util/normalizeTitle';

export type ContributionSurveyHeading = HTMLHeadingElement;

/**
 * Handles Deputy case pages, controls UI features, among other things.
 * This class should be able to operate both on the standard MediaWiki
 * parser output and the Parsoid output.
 */
export default class DeputyCasePage {

	static rootPage = new mw.Title(
		'Wikipedia:Contributor copyright investigations'
	);

	/**
	 * Checks if the current page (or a supplied page) is a case page (subpage of
	 * the root page).
	 *
	 * @param title The title of the page to check.
	 * @return `true` if the page is a case page.
	 */
	static isCasePage( title?: string | mw.Title ): boolean {
		return normalizeTitle( title ).getPrefixedDb()
			.startsWith( this.rootPage.getPrefixedDb() + '/' );
	}

	/**
	 * Gets the case name by parsing the title.
	 *
	 * @param title The title of the case page
	 * @return The case name, or `null` if the title was not a valid case page
	 */
	static getCaseName?( title?: string | mw.Title ): string {
		title = normalizeTitle( title );
		if ( !this.isCasePage( title ) ) {
			return null;
		} else {
			return title.getPrefixedText().replace(
				this.rootPage.getPrefixedText() + '/', ''
			);
		}
	}

	/**
	 * The document to be used as a reference.
	 */
	document: Document;

	/**
	 * @param document The document to use as a reference
	 */
	constructor( document?: Document ) {
		this.document = document ?? window.document;
	}

	/**
	 * Checks if a given element is a valid contribution survey heading.
	 *
	 * @param el The element to check for
	 * @return `true` if the given heading is a valid contribution survey heading.
	 */
	isContributionSurveyHeading( el: HTMLElement ): el is ContributionSurveyHeading {
		return el.tagName === 'H3' &&
			/^Pages \d+ to \d+$/.test(
				el.querySelector<HTMLElement>( '.mw-headline' ).innerText
			);
	}

	/**
	 * Finds the first contribution survey heading. This is always an <h3> element
	 * with the content matching the pattern "Pages \d+ to \d+"
	 *
	 * @return The <h3> element of the heading.
	 */
	findFirstContributionSurveyHeading(): ContributionSurveyHeading {
		return this.findContributionSurveyHeadings()[ 0 ];
	}

	/**
	 * Finds all contribution survey headings. These are <h3> elements
	 * with the content matching the pattern "Pages \d+ to \d+"
	 *
	 * @return The <h3> element of the heading.
	 */
	findContributionSurveyHeadings(): ContributionSurveyHeading[] {
		if ( !DeputyCasePage.isCasePage() ) {
			throw new Error( 'Current page is not a case page.' );
		} else {
			return ( Array.from( this.document.querySelectorAll(
				'.mw-parser-output h3 > .mw-headline'
			) ) as HTMLElement[] )
				.map( ( el ) => el.parentElement as HTMLHeadingElement )
				.filter( ( h ) => this.isContributionSurveyHeading( h ) );
		}
	}

	/**
	 * Gets all elements that are part of a contribution survey "section", that is
	 * a set of elements including the section heading and all elements succeeding
	 * the heading until (and exclusive of) the heading of the next section.
	 *
	 * In other words,
	 * YES: === Pages 1 to 2 ===
	 * YES: * [[Page 1]]
	 * YES: * [[Page 2]]
	 * YES:
	 * NO : === Pages 3 to 4 ===
	 *
	 * @param sectionHeading The section heading to work with
	 * @return An array of all HTMLElements covered by the section
	 */
	getContributionSurveySection( sectionHeading: HTMLElement ): HTMLElement[] {
		// Normalize "sectionHeading" to use the H3 element and not the .mw-heading span.
		if ( sectionHeading.tagName !== 'H3' && sectionHeading.parentElement.tagName !== 'H3' ) {
			throw new Error( 'Provided section heading is not a valid section heading.' );
		} else if ( sectionHeading.tagName !== 'H3' ) {
			sectionHeading = sectionHeading.parentElement;
		}

		const sectionMembers: HTMLElement[] = [];

		let nextSibling = sectionHeading.nextElementSibling as HTMLElement;
		while ( !this.isContributionSurveyHeading( nextSibling ) ) {
			sectionMembers.push( nextSibling );
			nextSibling = nextSibling.nextElementSibling as HTMLElement;
		}

		return sectionMembers;
	}

}
