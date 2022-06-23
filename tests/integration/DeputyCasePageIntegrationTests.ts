import { jest } from '@jest/globals';
import 'expect-puppeteer';
import '../../src/types';
import loadWikipediaPage from '../util/loadWikipediaPage';
import loadDeputyScript from '../util/loadDeputyScript';

describe( 'DeputyCasePage integration tests', () => {

	beforeAll( async () => {
		await loadWikipediaPage(
			'Wikipedia:Contributor copyright investigations/Chlod',
			true
		);
		await loadDeputyScript();

		jest.setTimeout( 10e3 );
	}, 180e3 );

	test( 'DeputyCasePage accessible', async () => {
		expect( await page.evaluate( () => {
			return window.deputy.DeputyCasePage != null;
		} ) ).toBe( true );
	} );

	test( 'isCasePage', async () => {
		await expect(
			page.evaluate(
				() => window.deputy.DeputyCasePage.isCasePage()
			)
		).resolves.toBe( true );
	} );

	test( 'isContributionSurveyHeading', async () => {
		await Promise.all( [
			// Actual headings
			...( [
				'testHeading1', 'testHeading2', 'testHeading3',
				'testHeading4', 'testHeading5', 'testHeading6',
				'testHeading7', 'testHeading8', 'testHeading9'
			].map( ( id ) => expect(
				page.evaluate( () => {
					const currentPage = new window.deputy.DeputyCasePage();
					return currentPage.isContributionSurveyHeading(
						document.getElementById( id ).nextElementSibling as HTMLElement
					);
				} )
			).resolves.toBe( true ) ) ),
			// Heading spans (should be false)
			...( [
				'testHeading1', 'testHeading2', 'testHeading3',
				'testHeading4', 'testHeading5', 'testHeading6',
				'testHeading7', 'testHeading8', 'testHeading9'
			].map( ( id ) => expect(
				page.evaluate( () => {
					const currentPage = new window.deputy.DeputyCasePage();
					return currentPage.isContributionSurveyHeading(
						( document.getElementById( id ).nextElementSibling as HTMLElement )
							.querySelector( '.mw-headline' ) as HTMLElement
					);
				} )
			).resolves.toBe( false ) ) ),
			// Other H3 headings
			...( [
				'testHeadingFake1'
			].map( ( id ) => expect(
				page.evaluate( () => {
					const currentPage = new window.deputy.DeputyCasePage();
					return currentPage.isContributionSurveyHeading(
						document.getElementById( id ).nextElementSibling as HTMLElement
					);
				} )
			).resolves.toBe( false ) ) ),
			// Other elements
			...( [
				'testHeading1', 'testHeading2', 'testHeading3',
				'testHeading4', 'testHeading5', 'testHeading6',
				'testHeading7', 'testHeading8', 'testHeading9'
			].map( ( id ) => expect(
				page.evaluate( () => {
					const currentPage = new window.deputy.DeputyCasePage();
					return currentPage.isContributionSurveyHeading(
						document.getElementById( id )
					);
				} )
			).resolves.toBe( false ) ) )
		] );
	} );

	test( 'findFirstContributionSurveyHeading', async () => {
		const targetId = `i-${Math.random().toFixed( 8 ).slice( 2 )}`;

		await page.evaluate( () => {
			( document.getElementById( 'testHeading1' ).nextElementSibling as HTMLElement )
				.setAttribute(
					'data-deputy-test',
					targetId
				);
		} );

		await expect(
			await page.evaluate(
				() => ( new window.deputy.DeputyCasePage() )
					.findFirstContributionSurveyHeading()
					.getAttribute( 'data-deputy-test' )
			)
		).resolves.toBe( targetId );
	} );

	test( 'findContributionSurveyHeadings', async () => {
		await expect(
			await page.evaluate(
				() => ( new window.deputy.DeputyCasePage() )
					.findContributionSurveyHeadings()
					.length
			)
		).resolves.toBe( 9 );
	} );

	test( 'getContributionSurveySection', async () => {
		await Promise.all( [
			'testHeading1', 'testHeading2', 'testHeading3',
			'testHeading4', 'testHeading5', 'testHeading6',
			'testHeading7', 'testHeading8', 'testHeading9'
		].map( ( id ) => expect(
			page.evaluate( () => {
				const currentPage = new window.deputy.DeputyCasePage();
				return currentPage.getContributionSurveySection(
					document.getElementById( id ).nextElementSibling as HTMLElement
				).filter( ( v ) => v.tagName === 'UL' ).length;
			} )
		).resolves.toBe( 1 ) ) );
	} );

} );
