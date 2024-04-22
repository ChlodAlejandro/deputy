import '../../../src/types';
import 'types-mediawiki';
import BrowserHelper from '../../util/BrowserHelper';

describe( 'wikiUtility (on-browser) function tests', () => {

	let page: BrowserHelper;

	beforeAll( async () => {
		page = await BrowserHelper.build()
			.then( p => p.loadWikipediaPage( 'Wikipedia:Sandbox' ) )
			.then( p => p.loadDeputyScript() );
	} );

	afterAll( async () => {
		await page.close();
	} );

	test( 'normalizeTitle', async () => {
		await Promise.all( [
			// Default test
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.normalizeTitle() };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 4, title: 'Sandbox'
			} ),

			// String parse test (mainspace)
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.normalizeTitle(
						'Main Page'
					) };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 0, title: 'Main_Page'
			} ),

			// String parse test (project space)
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.normalizeTitle(
						'Wikipedia:Contributor copyright investigations'
					) };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 4, title: 'Contributor_copyright_investigations'
			} ),

			// String parse test (subpage)
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.normalizeTitle(
						'Wikipedia:Contributor copyright investigations/Example'
					) };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 4, title: 'Contributor_copyright_investigations/Example'
			} ),

			// String parse test (fragment)
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.normalizeTitle(
						'Wikipedia:Contributor copyright investigations#Requests'
					) };
				} )
			).resolves.toEqual( {
				fragment: 'Requests', namespace: 4, title: 'Contributor_copyright_investigations'
			} ),

			// mw.Title test
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.normalizeTitle(
						new mw.Title( 'Main Page' )
					) };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 0, title: 'Main_Page'
			} )
		] );
	} );

	test( 'parseDiffUrl', async () => {
		await Promise.all( [
			// title only
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/w/index.php?title=Main_Page'
					) };
				} )
			).resolves.toEqual( {
				diff: null,
				oldid: null,
				title: 'Main Page'
			} ),
			// diff only
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/w/index.php?diff=123456'
					) };
				} )
			).resolves.toEqual( {
				diff: 123456,
				oldid: null,
				title: null
			} ),
			// oldid only
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/w/index.php?oldid=123456'
					) };
				} )
			).resolves.toEqual( {
				diff: null,
				oldid: 123456,
				title: null
			} ),
			// title and diff
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/w/index.php?title=Main_Page&diff=123456'
					) };
				} )
			).resolves.toEqual( {
				diff: 123456,
				oldid: null,
				title: 'Main Page'
			} ),
			// title and oldid
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/w/index.php?title=Main_Page&oldid=123456'
					) };
				} )
			).resolves.toEqual( {
				diff: null,
				oldid: 123456,
				title: 'Main Page'
			} ),
			// diff and oldid
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/w/index.php?diff=123456&oldid=123457'
					) };
				} )
			).resolves.toEqual( {
				diff: 123456,
				oldid: 123457,
				title: null
			} ),
			// title, diff, and oldid
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						// eslint-disable-next-line max-len
						'https://en.wikipedia.org/w/index.php?title=Main_Page&diff=123456&oldid=123457'
					) };
				} )
			).resolves.toEqual( {
				diff: 123456,
				oldid: 123457,
				title: 'Main Page'
			} ),
			// Special:Diff/diff
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/123456'
					) };
				} )
			).resolves.toEqual( {
				diff: 123456,
				oldid: null,
				title: null
			} ),
			// Special:Diff/oldid/diff
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/123456/123457'
					) };
				} )
			).resolves.toEqual( {
				diff: 123457,
				oldid: 123456,
				title: null
			} ),
			// Special:Diff/oldid/prev
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/123456/prev'
					) };
				} )
			).resolves.toEqual( {
				diff: 'prev',
				oldid: 123456,
				title: null
			} ),
			// Special:Diff/oldid/next
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/123456/next'
					) };
				} )
			).resolves.toEqual( {
				diff: 'next',
				oldid: 123456,
				title: null
			} ),
			// Special:Diff/prev/diff
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/prev/123456'
					) };
				} )
			).resolves.toEqual( {
				diff: 123456,
				oldid: 'prev',
				title: null
			} ),
			// Special:Diff/next/diff
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/next/123456'
					) };
				} )
			).resolves.toEqual( {
				diff: 123456,
				oldid: 'next',
				title: null
			} ),
			// (edge) Special:Diff/prev/prev
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/prev/prev'
					) };
				} )
			).resolves.toEqual( {
				diff: 'prev',
				oldid: 'prev',
				title: null
			} ),
			// (edge) Special:Diff/prev/next
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/prev/next'
					) };
				} )
			).resolves.toEqual( {
				diff: 'next',
				oldid: 'prev',
				title: null
			} ),
			// (edge) Special:Diff/next/next
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/next/next'
					) };
				} )
			).resolves.toEqual( {
				diff: 'next',
				oldid: 'next',
				title: null
			} ),
			// (edge) Special:Diff/next/prev
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:Diff/next/prev'
					) };
				} )
			).resolves.toEqual( {
				diff: 'prev',
				oldid: 'next',
				title: null
			} ),
			// Special:PermanentLink/oldid
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Special:PermanentLink/123456'
					) };
				} )
			).resolves.toEqual( {
				diff: null,
				oldid: 123456,
				title: null
			} ),
			// /wiki/Title
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Main_Page'
					) };
				} )
			).resolves.toEqual( {
				diff: null,
				oldid: null,
				title: 'Main Page'
			} ),
			// /wiki/Title?diff=
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Main_Page?diff=123456'
					) };
				} )
			).resolves.toEqual( {
				diff: 123456,
				oldid: null,
				title: 'Main Page'
			} ),
			// /wiki/Title?oldid=
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Main_Page?oldid=123456'
					) };
				} )
			).resolves.toEqual( {
				diff: null,
				oldid: 123456,
				title: 'Main Page'
			} ),
			// /wiki/Title?diff=&oldid=
			expect(
				page.evaluate( () => {
					return { ...window.deputy.wikiUtil.parseDiffUrl(
						'https://en.wikipedia.org/wiki/Main_Page?diff=123456&oldid=123457'
					) };
				} )
			).resolves.toEqual( {
				diff: 123456,
				oldid: 123457,
				title: 'Main Page'
			} )
		] );
	} );

} );
