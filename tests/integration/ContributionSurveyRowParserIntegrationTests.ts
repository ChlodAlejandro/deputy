import loadWikipediaPage from '../util/loadWikipediaPage';
import loadDeputyScript from '../util/loadDeputyScript';
import '../../src/types';

describe( 'ContributionSurveyRowParser integration tests', () => {
	const cases: string[] = [
		'ItsLassieTime',
		'Dawkeye',
		'GVnayR',
		'Marylandstater',
		'Borsoka',
		'Wikiwatcher1',
		'Judgesurreal777',
		'IWannaABillionaire',
		'Hantsheroes',
		'Arrwiki',
		'FreshCorp619',
		'Aetheling1125',
		'Dante8',
		'Trident13',
		'Skoojal',
		'DocOfSoc',
		'BiggestSataniaFangirl89',
		'20150927',
		'Aldebaran69',
		'Helena Bx',
		'20180325',
		'Edelmand',
		'20190125',
		'20190724',
		'20200212',
		'ZarhanFastfire',
		'Kiraroshi1976',
		'Greenock125',
		'JoeScarce',
		'20210127',
		'Manannan51',
		'20210315',
		'Amshpatten',
		'WikiProject Tropical cyclones',
		'Bluecountrymutt',
		'Werldwayd',
		'Shadowwarrior8',
		'20220220b',
		'I64s',
		'20220731',
		'20221001'
	];

	describe( 'Live parsing tests on open cases', () => {

		for ( const caseName of cases ) {
			jest.setTimeout( 40e3 );
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
