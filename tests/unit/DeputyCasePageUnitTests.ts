import { jest } from '@jest/globals';
import 'expect-puppeteer';
import '../../src/types';
import loadWikipediaPage from '../util/loadWikipediaPage';
import loadDeputyScript from '../util/loadDeputyScript';

describe( 'DeputyCasePage unit tests', () => {

	beforeAll( async () => {
		await loadWikipediaPage( 'User:Chlod/Scripts/Deputy/tests/TestCase 01' );
		await loadDeputyScript();

		jest.setTimeout( 10e3 );
	}, 180e3 );

	test( 'DeputyCasePage accessible', async () => {
		expect( await page.evaluate( () => {
			return window.deputy.DeputyCasePage != null;
		} ) ).toBe( true );
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
				page.evaluate(
					() => window.deputy.DeputyCasePage.rootPage.toText() ===
					'Wikipedia:Contributor copyright investigations'
				)
			).resolves.toBe( true ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						window.deputy.DeputyCasePage.rootPage.toText() + '/Example'
					)
				)
			).resolves.toBe( true ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						window.deputy.DeputyCasePage.rootPage.toText()
					)
				)
			).resolves.toBe( false ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						'Wikipedia:Contributor copyright investigations'
					)
				)
			).resolves.toBe( false ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						'Wikipedia:Contributor copyright investigations/Example'
					)
				)
			).resolves.toBe( true ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						'Main Page'
					)
				)
			).resolves.toBe( false )
		] );
	} );

	test( 'getCaseName', async () => {
		await Promise.all( [
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.getCaseName(
						'Wikipedia:Contributor copyright investigations'
					);
				} )
			).resolves.toBe( null ),
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.getCaseName(
						'Wikipedia:Contributor copyright investigations/Example'
					);
				} )
			).resolves.toBe( 'Example' ),

			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.getCaseName(
						'Wikipedia:Contributor copyright investigations/Example 2'
					);
				} )
			).resolves.toBe( 'Example 2' )
		] );
	} );

} );
