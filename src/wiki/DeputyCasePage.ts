import DeputyCasePageWikitext from './DeputyCasePageWikitext';
import sectionHeadingName from './util/sectionHeadingName';
import getPageTitle from './util/getPageTitle';
import DeputyCase from './DeputyCase';
import sectionHeadingId from './util/sectionHeadingId';

export type ContributionSurveyHeading = HTMLHeadingElement;

/**
 * Handles Deputy case pages, controls UI features, among other things.
 * This class should be able to operate both on the standard MediaWiki
 * parser output and the Parsoid output.
 */
export default class DeputyCasePage extends DeputyCase {

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
			if ( pageId != null ) {
				// Title might be out of date. Recheck for safety.
				title = await getPageTitle( pageId );
			}

			// Fix for old data (moved from section name to IDs as of c5251642)
			const oldSections =
				cachedInfo.lastActiveSections.some( ( v ) => v.indexOf( ' ' ) !== -1 );
			if ( oldSections ) {
				cachedInfo.lastActiveSections =
					cachedInfo.lastActiveSections.map( ( v ) => v.replace( / /g, '_' ) );
			}

			const casePage = new DeputyCasePage(
				pageId,
				title,
				document,
				parsoid,
				cachedInfo.lastActive,
				cachedInfo.lastActiveSections
			);
			if ( oldSections ) {
				// Save to fix the data in storage
				await casePage.saveToCache();
			}
			return casePage;
		} else {
			return new DeputyCasePage( pageId, title, document, parsoid );
		}
	}

	/**
	 * The n-cache stores the `n` of contribution survey headings. In other
	 * words, it differentiates survey headings by giving it a number if
	 * another section on the page has a matching heading. The n-cache
	 * only contains the n of contribution survey headings, but counts all
	 * HTML headings as part of the n-cache.
	 */
	nCache: Map<ContributionSurveyHeading, number>;

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
		super(
			pageId ?? window.deputy.currentPageId,
			title ?? window.deputy.currentPage
		);
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
	isContributionSurveyHeading( el: Node ): el is ContributionSurveyHeading {
		if ( !( el instanceof HTMLElement ) ) {
			return false;
		}

		// All headings (h1, h2, h3, h4, h5, h6)
		// TODO: l10n
		const headlineElement = this.parsoid ?
			el :
			el.querySelector<HTMLElement>( '.mw-headline' );
		// Handle DiscussionTools case (.mw-heading)
		return ( el.classList.contains( 'mw-heading' ) || /^H\d$/.test( el.tagName ) ) &&
			headlineElement != null &&
			/(Page|Article|Local file|File)s? \d+ (to|through) \d+$/.test( headlineElement.innerText );
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
	 * @param sectionIdentifier The section identifier to look for, usually the section
	 * name unless `useId` is set to true.
	 * @param useId Whether to use the section name instead of the ID
	 * @return The <h*> element of the heading.
	 */
	findContributionSurveyHeading(
		sectionIdentifier: string,
		useId = false
	): ContributionSurveyHeading {
		// No need to perform .mw-headline existence check here, already
		// done by `findContributionSurveyHeadings`
		return this.findContributionSurveyHeadings()
			.find(
				( v ) =>
					useId ?
						sectionHeadingId( v ) === sectionIdentifier :
						sectionHeadingName( v ) === sectionIdentifier
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
			throw new Error( 'Current page is not a case page. Expected subpage of ' +
				DeputyCasePage.rootPage.getPrefixedText() );
		} else {
			return ( Array.from( this.document.querySelectorAll(
				// All headings (`h1, h2, h3, h4, h5, h6`)
				[ 1, 2, 3, 4, 5, 6 ]
					.map( ( i ) => `.mw-parser-output h${i}` )
					.join( ',' )
			) ) as HTMLHeadingElement[] )
				.filter( ( h ) => this.isContributionSurveyHeading( h ) );
		}
	}

	/**
	 * Normalizes a section heading. On some pages, DiscussionTools wraps the heading
	 * around in a div, which breaks some assumptions with the DOM tree (e.g. that the
	 * heading is immediately followed by section elements).
	 *
	 * This returns the element at the "root" level, i.e. the wrapping <div> when
	 * DiscussionTools is active, or the <h2> when it is not.
	 * @param heading
	 */
	normalizeSectionHeading( heading: HTMLElement ): ContributionSurveyHeading {
		if ( !this.isContributionSurveyHeading( heading ) ) {
			if ( !this.isContributionSurveyHeading( heading.parentElement ) ) {
				throw new Error( 'Provided section heading is not a valid section heading.' );
			} else {
				heading = heading.parentElement;
			}
		}
		// When DiscussionTools is being used, the header is wrapped in a div.
		if ( heading.parentElement.classList.contains( 'mw-heading' ) ) {
			heading = heading.parentElement;
		}
		return heading as ContributionSurveyHeading;
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
	getContributionSurveySection( sectionHeading: HTMLElement ): Node[] {
		// Normalize "sectionHeading" to use the h* element and not the .mw-heading span.
		sectionHeading = this.normalizeSectionHeading( sectionHeading );

		const sectionMembers: Node[] = [];

		let nextSibling = sectionHeading.nextSibling;
		while ( nextSibling != null && !this.isContributionSurveyHeading( nextSibling ) ) {
			sectionMembers.push( nextSibling );
			nextSibling = nextSibling.nextSibling as HTMLElement;
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
	 * @param sectionId The ID of the section to add.
	 */
	async addActiveSection( sectionId: string ): Promise<void> {
		const lastActiveSection = this.lastActiveSections.indexOf( sectionId );
		if ( lastActiveSection === -1 ) {
			this.lastActiveSections.push( sectionId );
			await this.saveToCache();
		}
	}

	/**
	 * Remove a section from the list of active sections. This will disable autostart
	 * for this section.
	 *
	 * @param sectionId ID of the section to remove
	 */
	async removeActiveSection( sectionId: string ): Promise<void> {
		const lastActiveSection = this.lastActiveSections.indexOf( sectionId );
		if ( lastActiveSection !== -1 ) {
			this.lastActiveSections.splice( lastActiveSection, 1 );
			await this.saveToCache();
		}
	}

}
