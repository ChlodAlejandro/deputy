import { jest } from '@jest/globals';
import 'expect-puppeteer';
import '../src/types';
import loadWikipediaPage from './util/loadWikipediaPage';
import loadDeputyScript from './util/loadDeputyScript';

describe( 'DeputyCasePage tests', () => {

	beforeAll( async () => {
		await loadWikipediaPage( 'Wikipedia:Sandbox' );
		await loadDeputyScript();

		jest.setTimeout( 10000 );
	}, 30000 );

	test( 'DeputyCasePage accessible', async () => {
		expect( await page.evaluate( () => {
			return window.deputy.DeputyCasePage != null;
		} ) ).toBe( true );
	} );

	test( 'normalizeTitle', async () => {

	} );

	test( 'isCasePage', async () => {
		// Override root page
		await page.evaluate( () => {
			window.deputy.DeputyCasePage.rootPage = new mw.Title(
				'Wikipedia:Contributor copyright investigations'
			);
		} );

		return Promise.all( [
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.rootPage.toText() ===
						'Wikipedia:Contributor copyright investigations';
				} )
			).resolves.toBe( true ),
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.isCasePage(
						window.deputy.DeputyCasePage.rootPage.toText() + '/Example'
					);
				} )
			).resolves.toBe( true ),
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.isCasePage(
						window.deputy.DeputyCasePage.rootPage.toText()
					);
				} )
			).resolves.toBe( false ),
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.isCasePage(
						'Wikipedia:Contributor copyright investigations'
					);
				} )
			).resolves.toBe( false ),
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.isCasePage(
						'Wikipedia:Contributor copyright investigations/Example'
					);
				} )
			).resolves.toBe( true ),
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.isCasePage(
						'Main Page'
					);
				} )
			).resolves.toBe( false )
		] );
	} );

} );
