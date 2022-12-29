import '../../src/types';
import 'types-mediawiki';
import BrowserHelper from '../util/BrowserHelper';

describe( 'Browser load tests', () => {

	let page: BrowserHelper;

	beforeAll( async () => {
		page = await BrowserHelper.build()
			.then( p => p.loadWikipediaPage( 'Wikipedia:Sandbox' ) );

		// Override root page
		await page.evaluate( () => {
			mw.hook( 'deputy.preload' ).add( () => {
				window.deputy.getWikiConfig().then( function () {
					// Override root pages for testing
					window.deputy.wikiConfig.cci.rootPage.set(
						new mw.Title(
							'User:Chlod/Scripts/Deputy/tests'
						)
					);
					window.deputy.wikiConfig.cci.rootPage.lock();
				} );
			} );
		} );
	} );

	afterAll( async () => {
		await page.close();
	} );

	test( 'Deputy loads successfully', async () => {
		await expect( page.loadDeputyScript() ).resolves.not.toThrow();
	} );

} );
