import DeputyCasePage from './DeputyCasePage';
import getPageContent from './util/getPageContent';

/**
 * Used by DeputyCasePage to access the page's raw wikitext, make changes,
 * etc.
 */
export default class DeputyCasePageWikitext {

	/**
	 * The source case page.
	 */
	casePage: DeputyCasePage;

	/**
	 * The cached wikitext page content.
	 */
	content: Awaited<ReturnType<typeof getPageContent>>;

	/**
	 *
	 * @param casePage
	 */
	constructor( casePage: DeputyCasePage ) {
		this.casePage = casePage;
	}

	/**
	 * Gets the wikitext for this page.
	 */
	async getWikitext(): Promise<DeputyCasePageWikitext['content']> {
		return this.content ??
			( this.content = await getPageContent( this.casePage.pageId ) );
	}

	/**
	 * Removes the cached wikitext for this page.
	 */
	resetCachedWikitext(): void {
		this.content = undefined;
	}

	/**
	 * Gets the wikitext for a specific section. The section will be parsed using the
	 * wikitext cache if a section title was provided. Otherwise, it will attempt to
	 * grab the section using API:Query for an up-to-date version.
	 *
	 * @param section The section to edit
	 * @param n If the section heading appears multiple times in the page and n is
	 * provided, this function extracts the nth occurrence of that section heading.
	 */
	async getSectionWikitext(
		section: string | number,
		n = 1
	): Promise<string & { revid: number }> {
		if ( typeof section === 'number' ) {
			return getPageContent(
				this.casePage.pageId,
				{ rvsection: section }
			).then( ( v ) => {
				return Object.assign( v.toString(), {
					revid: v.revid
				} );
			} );
		} else {
			const wikitext = await this.getWikitext();
			const wikitextLines = wikitext.split( '\n' );

			let capturing = false;
			let captureLevel = 0;
			let currentN = 1;
			const sectionLines = [];
			for ( let i = 0; i < wikitextLines.length; i++ ) {
				const line = wikitextLines[ i ];
				const headerCheck = /^(=={1,5})\s*(.+?)\s*=={1,5}$/.exec( line );

				if (
					!capturing &&
					headerCheck != null &&
					headerCheck[ 2 ] === section
				) {
					if ( currentN < n ) {
						currentN++;
					} else {
						sectionLines.push( line );
						capturing = true;
						captureLevel = headerCheck[ 1 ].length;
					}
				} else if ( capturing ) {
					if ( headerCheck != null && headerCheck[ 1 ].length <= captureLevel ) {
						capturing = false;
						break;
					} else {
						sectionLines.push( line );
					}
				}
			}

			return Object.assign(
				sectionLines.join( '\n' ), {
					revid: wikitext.revid
				}
			);
		}
	}

}
