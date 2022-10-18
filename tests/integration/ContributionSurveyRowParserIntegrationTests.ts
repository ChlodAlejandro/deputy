import loadWikipediaPage from '../util/loadWikipediaPage';
import loadDeputyScript from '../util/loadDeputyScript';
import '../../src/types';

describe( 'ContributionSurveyRowParser integration tests', () => {
	const cases: string[] = [
		'ItsLassieTime',
		'Dawkeye',
		'Shadowwarrior8'
	];

	describe( 'Live parsing tests on open cases', () => {

		for ( const caseName of cases ) {
			jest.setTimeout( 300e3 );
			test( 'enwiki:' + caseName, async () => {
				const caseTitle = 'Wikipedia:Contributor copyright investigations/' + caseName;

				await loadWikipediaPage( caseTitle );
				await loadDeputyScript();

				await expect( page.evaluate( async () => {
					let res: ( result: boolean ) => void;
					const fakePromise = new Promise( ( _res ) => {
						res = _res;
					} );
					mw.hook( 'deputy.load.cci.root' ).add( () => {
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
			} );
		}
	} );
} );
