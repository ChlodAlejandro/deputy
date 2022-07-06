import normalizeTitle from '../util/normalizeTitle';
import DeputyCasePageWikitext from './DeputyCasePageWikitext';
import sectionHeadingName from '../util/sectionHeadingName';

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
	 * The page ID of the case page.
	 */
	pageId: number;
	/**
	 * A timestamp of when this case page was last worked on.
	 */
	lastActive: number = Date.now();
	/**
	 * The sections last worked on for this case page.
	 */
	lastActiveSections: string[] = [];
	/**
	 * Title of this page.
	 */
	title: mw.Title;
	/**
	 * The document to use as a reference.
	 */
	document: Document;
	/**
	 * Whether this page is a Parsoid HTML5 with RDFa markup page or not.
	 */
	parsoid: boolean;
	/**
	 * The wikitext handler of the page.
	 */
	wikitext: DeputyCasePageWikitext;

	/**
	 * @param pageId The page ID of the case page.
	 * @param title The title of the page being accessed
	 * @param document The document to be used as a reference.
	 * @param parsoid Whether this is a Parsoid document or not.
	 */
	static async build(
		pageId?: number,
		title?: mw.Title,
		document?: Document,
		parsoid?: boolean
	): Promise<DeputyCasePage> {
		const cachedInfo = await window.deputy.storage.db.get(
			'casePageCache',
			pageId ?? window.deputy.currentPageId
		);
		if ( cachedInfo != null ) {
			return new DeputyCasePage(
				pageId,
				title,
				document,
				parsoid,
				cachedInfo.lastActive,
				cachedInfo.lastActiveSections
			);
		} else {
			return new DeputyCasePage( pageId, title, document, parsoid );
		}
	}

	/**
	 * @param pageId The page ID of the case page.
	 * @param title The title of the page being accessed
	 * @param document The document to be used as a reference.
	 * @param parsoid Whether this is a Parsoid document or not.
	 * @param lastActive
	 * @param lastActiveSessions
	 */
	private constructor(
		pageId?: number,
		title?: mw.Title,
		document?: Document,
		parsoid?: boolean,
		lastActive?: number,
		lastActiveSessions?: string[]
	) {
		this.pageId = pageId ?? window.deputy.currentPageId;
		this.title = title ?? window.deputy.currentPage;
		this.document = document ?? window.document;
		this.parsoid = parsoid ?? /mw: http:\/\/mediawiki.org\/rdf\//.test(
			this.document.documentElement.getAttribute( 'prefix' )
		);
		this.wikitext = new DeputyCasePageWikitext( this );

		this.lastActive = lastActive ?? Date.now();
		this.lastActiveSections = lastActiveSessions ?? [];
	}

	/**
	 * Checks if a given element is a valid contribution survey heading.
	 *
	 * @param el The element to check for
	 * @return `true` if the given heading is a valid contribution survey heading.
	 */
	isContributionSurveyHeading( el: HTMLElement ): el is ContributionSurveyHeading {
		// All headings (h1, h2, h3, h4, h5, h6)
		const headlineElement = this.parsoid ? el : el.querySelector<HTMLElement>( '.mw-headline' );
		return /^H\d$/.test( el.tagName ) &&
			headlineElement != null &&
			/(Page|Article|Local file|File)s? \d+ to \d+$/.test( headlineElement.innerText );
	}

	/**
	 * Finds the first contribution survey heading. This is always an <h*> element
	 * with the content matching the pattern "Pages \d+ to \d+"
	 *
	 * @return The <h*> element of the heading.
	 */
	findFirstContributionSurveyHeading(): ContributionSurveyHeading {
		return this.findContributionSurveyHeadings()[ 0 ];
	}

	/**
	 * Find a contribution survey heading by section name.
	 *
	 * @param sectionName The section name to look for
	 * @return The <h*> element of the heading.
	 */
	findContributionSurveyHeading( sectionName: string ): ContributionSurveyHeading {
		// No need to perform .mw-headline existence check here, already
		// done by `findContributionSurveyHeadings`
		return this.findContributionSurveyHeadings()
			.find(
				( v ) => sectionHeadingName( v ) === sectionName
			);
	}

	/**
	 * Finds all contribution survey headings. These are <h*> elements
	 * with the content matching the pattern "Pages \d+ to \d+"
	 *
	 * @return The <h*> element of the heading.
	 */
	findContributionSurveyHeadings(): ContributionSurveyHeading[] {
		if ( !DeputyCasePage.isCasePage() ) {
			throw new Error( 'Current page is not a case page.' );
		} else {
			return ( Array.from( this.document.querySelectorAll(
				// All headings (h1, h2, h3, h4, h5, h6)
				[ 1, 2, 3, 4, 5, 6 ]
					.map( ( i ) => `.mw-parser-output h${i}` )
					.join( ',' )
			) ) as HTMLHeadingElement[] )
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
		// Normalize "sectionHeading" to use the h* element and not the .mw-heading span.
		if ( !this.isContributionSurveyHeading( sectionHeading ) ) {
			if ( !this.isContributionSurveyHeading( sectionHeading.parentElement ) ) {
				throw new Error( 'Provided section heading is not a valid section heading.' );
			} else {
				sectionHeading = sectionHeading.parentElement;
			}
		}

		const sectionMembers: HTMLElement[] = [];

		let nextSibling = sectionHeading.nextElementSibling as HTMLElement;
		while ( nextSibling != null && !this.isContributionSurveyHeading( nextSibling ) ) {
			sectionMembers.push( nextSibling );
			nextSibling = nextSibling.nextElementSibling as HTMLElement;
		}

		return sectionMembers;
	}

	/**
	 * Check if this page is cached.
	 */
	async isCached(): Promise<boolean> {
		return await window.deputy.storage.db.get( 'casePageCache', this.pageId ) != null;
	}

	/**
	 * Saves the current page to the IDB page cache.
	 */
	async saveToCache(): Promise<void> {
		await window.deputy.storage.db.put( 'casePageCache', {
			pageID: this.pageId,
			lastActive: this.lastActive,
			lastActiveSections: this.lastActiveSections
		} );
	}

	/**
	 * Deletes the current page from the cache. This is generally not advised, unless the
	 * user wishes to forget the case page entirely.
	 */
	async deleteFromCache(): Promise<void> {
		await window.deputy.storage.db.delete( 'casePageCache', this.pageId );
	}

	/**
	 * Bumps this page's last active timestamp.
	 */
	async bumpActive(): Promise<void> {
		this.lastActive = Date.now();
		await this.saveToCache();
	}

	/**
	 * Add a section to the list of active sessions. This is used for automatic starting
	 * and for one-click continuation of past active sessions.
	 *
	 * @param section
	 */
	async addActiveSection( section: string ): Promise<void> {
		const lastActiveSection = this.lastActiveSections.indexOf( section );
		if ( lastActiveSection === -1 ) {
			this.lastActiveSections.push( section );
			await this.saveToCache();
		}
	}

	/**
	 * Remove a section from the list of active sections. This will disable autostart
	 * for this section.
	 *
	 * @param section
	 */
	async removeActiveSection( section: string ): Promise<void> {
		const lastActiveSection = this.lastActiveSections.indexOf( section );
		if ( lastActiveSection !== -1 ) {
			this.lastActiveSections.splice( lastActiveSection, 1 );
			await this.saveToCache();
		}
	}

}
