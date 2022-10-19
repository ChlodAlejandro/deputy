import loadWikipediaPage from '../util/loadWikipediaPage';
import loadDeputyScript from '../util/loadDeputyScript';
import '../../src/types';

describe( 'Browser load tests', () => {

	beforeAll( async () => {
		await loadWikipediaPage( 'User:Chlod/Scripts/Deputy/tests/TestCase 01' );

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
	}, 60e3 );

	test( 'Deputy loads successfully', async () => {
		await expect( loadDeputyScript() ).resolves.toBe( true );
	} );

} );
