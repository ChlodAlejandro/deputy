import '../../src/types';
import 'types-mediawiki';
import BrowserHelper from '../util/BrowserHelper';

describe( 'ContributionSurveyRowParser integration tests', () => {
	const cases: string[] = [
		'S710',
		'Dawkeye',
		'Shadowwarrior8'
	];

	describe( 'Live parsing tests on open cases', () => {

		for ( const caseName of cases ) {
			test( 'enwiki:' + caseName, async () => {
				const caseTitle = 'Wikipedia:Contributor copyright investigations/' + caseName;

				const page = await BrowserHelper.build()
					.then( p => p.loadWikipediaPage( caseTitle ) )
					.then( p => p.loadDeputyScript() );

				await expect( page.evaluate( async () => {
					let res: ( result: boolean ) => void;
					const fakePromise = new Promise( ( _res ) => {
						res = _res;
					} );
					mw.hook( 'deputy.load.cci.session' ).add( () => {
						res( false );
					} );
					mw.hook( 'deputy.errors.cciRowParse' ).add( ( data ) => {
						res( data );
					} );
					( window.deputy as any ).NO_ROW_LOADING = true;

					await window.deputy.session.DeputyRootSession.startSession(
						( await window.deputy.DeputyCasePage.build() )
							.findContributionSurveyHeadings()
					);

					return fakePromise;
				} ) ).resolves.toEqual( false );

				await page.close();
			} );
		}
	} );
} );
