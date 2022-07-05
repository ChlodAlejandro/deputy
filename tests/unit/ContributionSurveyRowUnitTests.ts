import { jest } from '@jest/globals';
import 'expect-puppeteer';
import '../../src/types';
import loadWikipediaPage from '../util/loadWikipediaPage';
import loadDeputyScript from '../util/loadDeputyScript';
import { ContributionSurveyRowStatus } from '../../src/models/ContributionSurveyRow';

describe( 'ContributionSurveyRow static unit tests', () => {

	beforeAll( async () => {
		await loadWikipediaPage( 'Wikipedia:Sandbox' );
		await loadDeputyScript();

		jest.setTimeout( 10e3 );
	}, 180e3 );

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
			'*[[:Example]] {{done}} with {{y}}'
		];
		// Cases that require special treatment from other parsing methods.
		const expectFalse: string[] = [
			// WikiProject Tropical cyclones
			'*[[:1852 Atlantic hurricane season]]',
			// 20110727 11
			'*[[:c:File:Corrected Pueblo County, CO, Courthouse IMG 5089.JPG]]',
			// Not part of a list
			'[[:1852 Atlantic hurricane season]]',
			// Not a contribution survey row
			'{{collapse bottom}}',
			'<div class="testHeading1"></div>'
		];

		return Promise.all( [
			...expectTrue.map( async ( _text ) => expect(
				page.evaluate(
					( text ) => window.deputy.models.ContributionSurveyRow
						.isContributionSurveyRowText( text ) ? text : false,
					_text
				)
			).resolves.toBe( _text ) ),
			...expectFalse.map( async ( _text ) => expect(
				page.evaluate(
					( text ) => window.deputy.models.ContributionSurveyRow
						.isContributionSurveyRowText( text ) ? text : false,
					_text
				)
			).resolves.toBe( false ) )
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
						'cleaned'
					);
				} )
			).resolves.toBe( ContributionSurveyRowStatus.Unknown )
		] );
	} );

} );
/*
describe( 'ContributionSurveyRow implementation unit tests', () => {

	beforeAll( async () => {
		await loadWikipediaPage( 'User:Chlod/Scripts/Deputy/tests/TestCase 01' );
		await loadDeputyScript();
		// Override root page
		await page.evaluate( () => {
			window.deputy.DeputyCasePage.rootPage = new mw.Title(
				'User:Chlod/Scripts/Deputy/tests'
			);
		} );

		jest.setTimeout( 10e3 );
	}, 180e3 );

} );
*/
