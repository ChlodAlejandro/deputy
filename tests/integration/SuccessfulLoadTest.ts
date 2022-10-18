import loadWikipediaPage from '../util/loadWikipediaPage';
import loadDeputyScript from '../util/loadDeputyScript';
import '../../src/types';

describe( 'ContributionSurveyRowParser integration tests', () => {

	test( 'Deputy loads successfully', async () => {
		await loadWikipediaPage( 'User:Chlod/Scripts/Deputy/tests/TestCase 01' );

		// Override root page
		await page.evaluate( () => {
			mw.hook( 'deputy.preload' ).add( () => {
				window.deputy.wikiConfig.cci.rootPage.set(
					new mw.Title(
						'User:Chlod/Scripts/Deputy/tests'
					)
				);
			} );
		} );

		await loadDeputyScript();
	} );

} );
