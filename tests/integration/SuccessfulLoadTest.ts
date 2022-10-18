import loadWikipediaPage from '../util/loadWikipediaPage';
import loadDeputyScript from '../util/loadDeputyScript';
import '../../src/types';

describe( 'Browser load tests', () => {

	beforeAll( async () => {
		await loadWikipediaPage( 'User:Chlod/Scripts/Deputy/tests/TestCase 01' );

		// Override root page
		await page.evaluate( () => {
			mw.hook( 'deputy.preload' ).add( () => {
				window.deputy.getWikiConfig().then( function ( wikiConfig ) {
					// Override root pages for testing
					wikiConfig.cci.rootPage.set(
						new mw.Title(
							'User:Chlod/Scripts/Deputy/tests'
						)
					);
				} );
			} );
		} );
	} );

	test( 'Deputy loads successfully', async () => {
		await expect( loadDeputyScript() ).resolves.toBe( true );
	} );

	test( 'CCI session starts normally', async () => {
		await expect( loadDeputyScript() ).resolves.toBe( true );

		// Click the "start CCI session" button.
		await page.$( '.deputy.dp-sessionStarter a' )
			.then( ( a ) => {
				expect( a ).not.toBeUndefined();
				a.click();
			} );

		// Wait for load finish
		await expect( page.evaluate( async () => {
			return new Promise<boolean>( ( res ) => {
				mw.hook( 'deputy.load.cci.root' ).add( () => {
					res( true );
				} );
				setTimeout( () => {
					res( false );
				}, 10e3 );
			} );
		} ) ).resolves.toBe( true );

		// Responding to communication requests
		await expect( page.evaluate( async () => {
			const comms = new window.deputy.DeputyCommunications();
			comms.init();
			return comms.sendAndWait( { type: 'sessionRequest' } );
		} ) ).resolves.not.toBeFalsy();

		// Appended to UI
		await expect( page.$( '.deputy.dp-cs-section' ) ).resolves.not.toBeFalsy();
	} );

} );
