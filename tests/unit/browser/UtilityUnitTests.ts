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

} );
