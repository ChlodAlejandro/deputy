import '../../../src/types';
import 'types-mediawiki';
import { ContributionSurveyRowStatus } from '../../../src/models/ContributionSurveyRow';
import BrowserHelper from '../../util/BrowserHelper';

describe( 'ContributionSurveyRow static unit tests', () => {

	let page: BrowserHelper;

	beforeAll( async () => {
		page = await BrowserHelper.build()
			.then( p => p.loadWikipediaPage( 'Wikipedia:Sandbox' ) )
			.then( p => p.loadDeputyScript() );
	} );

	afterAll( async () => {
		await page.close();
	} );

	test( 'ContributionSurveyRow accessible', async () => {
		expect( await page.evaluate( () => {
			return window.deputy.models.ContributionSurveyRow != null;
		} ) ).toBe( true );
	} );

	test( 'isContributionSurveyRowText', async () => {
		const expectTrue: string[] = [
			// Standard
			'* [[:Example]]: (1 edit) [[Special:Diff/123456|(+173)]]',
			'* [[:Example]]: (1 edit, 1 major, +173) [[Special:Diff/123456|(+173)]]',
			'* [[:Example]]: {{?}} Deleted',
			'* [[:Example]] (1 edit): [[Special:Diff/123456|(+173)]]',
			'* [[:Example]] (1 edit, 1 major, +173): [[Special:Diff/123456|(+173)]]',
			'* [[:Example]] {{?}} Deleted',

			// Created page
			'* \'\'\'N\'\'\' [[:Example]]: (1 edit) [[Special:Diff/123456|(+173)]]',

			// With comment
			'* [[:Example]]: {{y}} <span style="background:#ffff55">\'\'\'\'\'[[User:Chlod|Chlod' +
			']]\'\'\'\'\'</span>&nbsp;<small style="font-size:calc(1em - 2pt)">([[#top|top]]&nbs' +
			'p;•&nbsp;[[Special:Contributions/Chlod|contribs]])</small> 16:22, 28 June 2022 (UTC)',

			// Possible edge cases
			'*[[:Example]]: (1 edit)',
			'*[[:Example]] (1 edit, 1 major, +173)',
			'*[[:Example]] (1 edit, 1 major, +173) {{n}}',
			'*[[:Example]] {{?}}',
			'*[[:Example]] {{done}} with {{y}}',
			// WikiProject Tropical cyclones
			'*[[:1852 Atlantic hurricane season]]',
			// 20110727 11
			'*[[:c:File:Corrected Pueblo County, CO, Courthouse IMG 5089.JPG]]'
		];
		// Cases that require special treatment from other parsing methods.
		const expectFalse: string[] = [
			// Not part of a list
			'[[:1852 Atlantic hurricane season]]',
			// Not a contribution survey row
			'{{collapse bottom}}',
			'<div class="testHeading1"></div>'
		];

		return Promise.all( [
			...expectTrue.map( async ( _text ) => expect(
				page.evaluate( async ( text ) => {
					const casePage = await window.deputy.DeputyCasePage.build();
					try {
						// eslint-disable-next-line no-new
						new window.deputy.models.ContributionSurveyRow( casePage, text );
						return true;
					} catch ( e ) {
						return false;
					}
				}, _text )
			).resolves.toBe( true ) ),
			...expectFalse.map( async ( _text ) => expect(
				page.evaluate( async ( text ) => {
					const casePage = await window.deputy.DeputyCasePage.build();
					try {
						// eslint-disable-next-line no-new
						new window.deputy.models.ContributionSurveyRow( casePage, text );
						return false;
					} catch ( e ) {
						return true;
					}
				}, _text )
			).resolves.toBe( true ) )
		] );
	} );

	test( 'identifyCommentStatus', async () => {
		await Promise.all( [
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{y}}'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.WithViolations ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{Y}}'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.WithViolations ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{y}} cleaned'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.WithViolations ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{n}}'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.WithoutViolations ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{N}}'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.WithoutViolations ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{n}} inconclusive'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.WithoutViolations ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{?}}'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.Missing ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{?}} something up'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.Missing ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'gone {{?}}'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.Missing ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{x}}'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.PresumptiveRemoval ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'BOOM {{x}}'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.PresumptiveRemoval ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'{{x}} explosion!'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.PresumptiveRemoval ),
			expect(
				page.evaluate( () => {
					return window.deputy.models.ContributionSurveyRow.identifyCommentStatus(
						'cleaned'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.Unknown )
		] );
	} );

} );
