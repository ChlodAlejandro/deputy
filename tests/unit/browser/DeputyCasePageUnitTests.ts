import '../../../src/types';
import 'types-mediawiki';
import BrowserHelper from '../../util/BrowserHelper';

describe( 'DeputyCasePage static unit tests', () => {

	let page: BrowserHelper;

	beforeAll( async () => {
		page = await BrowserHelper.build()
			.then( p => p.loadWikipediaPage( 'Wikipedia:Sandbox' ) )
			.then( p => p.loadDeputyScript() );
	} );

	afterAll( async () => {
		await page.close();
	} );

	test( 'DeputyCasePage accessible', async () => {
		expect( await page.evaluate( () => {
			return window.deputy.DeputyCasePage != null;
		} ) ).toBe( true );
	} );

	test( 'isCasePage', async () => {
		// Override root page
		await page.evaluate( async () => {
			await window.deputy.getWikiConfig().then( function ( wikiConfig ) {
				// Override root pages for testing
				wikiConfig.cci.rootPage.set(
					new mw.Title( 'Wikipedia:Contributor copyright investigations' )
				);
			} );
		} );

		return Promise.all( [
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.rootPage.toText() ===
					'Wikipedia:Contributor copyright investigations'
				)
			).resolves.toBe( true ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						window.deputy.DeputyCasePage.rootPage.toText() + '/Example'
					)
				)
			).resolves.toBe( true ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						window.deputy.DeputyCasePage.rootPage.toText()
					)
				)
			).resolves.toBe( false ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						'Wikipedia:Contributor copyright investigations'
					)
				)
			).resolves.toBe( false ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						'Wikipedia:Contributor copyright investigations/Example'
					)
				)
			).resolves.toBe( true ),
			expect(
				page.evaluate(
					() => window.deputy.DeputyCasePage.isCasePage(
						'Main Page'
					)
				)
			).resolves.toBe( false )
		] );
	} );

	test( 'getCaseName', async () => {
		await Promise.all( [
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.getCaseName(
						'Wikipedia:Contributor copyright investigations'
					);
				} )
			).resolves.toBe( null ),
			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.getCaseName(
						'Wikipedia:Contributor copyright investigations/Example'
					);
				} )
			).resolves.toBe( 'Example' ),

			expect(
				page.evaluate( () => {
					return window.deputy.DeputyCasePage.getCaseName(
						'Wikipedia:Contributor copyright investigations/Example 2'
					);
				} )
			).resolves.toBe( 'Example 2' )
		] );
	} );

} );

describe( 'DeputyCasePage implementation unit tests', () => {

	let page: BrowserHelper;

	beforeAll( async () => {
		page = await BrowserHelper.build()
			.then( p => p.loadWikipediaPage( 'User:Chlod/Scripts/Deputy/tests/TestCase 01' ) )
			.then( p => p.loadDeputyScript() );

		// Override root page
		await page.evaluate( async () => {
			await window.deputy.getWikiConfig().then( function ( wikiConfig ) {
				// Override root pages for testing
				wikiConfig.cci.rootPage.set(
					new mw.Title( 'User:Chlod/Scripts/Deputy/tests' )
				);
			} );
		} );
	} );

	afterAll( async () => {
		await page.close();
	} );

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

	test( 'getCaseName', async () => {
		await expect(
			page.evaluate( () => {
				return window.deputy.DeputyCasePage.getCaseName();
			} )
		).resolves.toBe( 'TestCase 01' );
	} );

	test( 'isContributionSurveyHeading', async () => {
		await Promise.all( [
			// Actual headings
			...( [
				'testHeading1', 'testHeading2', 'testHeading3',
				'testHeading4', 'testHeading5', 'testHeading6',
				'testHeading7', 'testHeading8', 'testHeading9'
			].map( ( _id ) => expect(
				page.evaluate( async ( id ) => {
					console.log( id, document.getElementById( id ) );
					const currentPage = await window.deputy.DeputyCasePage.build();
					return currentPage.isContributionSurveyHeading(
						document.getElementById( id ).nextElementSibling as HTMLElement
					);
				}, _id )
			).resolves.toBe( true ) ) ),
			// Heading spans (should be false)
			...( [
				'testHeading1', 'testHeading2', 'testHeading3',
				'testHeading4', 'testHeading5', 'testHeading6',
				'testHeading7', 'testHeading8', 'testHeading9'
			].map( ( _id ) => expect(
				page.evaluate( async ( id ) => {
					const currentPage = await window.deputy.DeputyCasePage.build();
					return currentPage.isContributionSurveyHeading(
						( document.getElementById( id ).nextElementSibling as HTMLElement )
							.querySelector( '.mw-headline' ) as HTMLElement
					);
				}, _id )
			).resolves.toBe( false ) ) ),
			// Other H3 headings
			...( [
				'testHeadingFake1'
			].map( ( _id ) => expect(
				page.evaluate( async ( id ) => {
					const currentPage = await window.deputy.DeputyCasePage.build();
					return currentPage.isContributionSurveyHeading(
						document.getElementById( id ).nextElementSibling as HTMLElement
					);
				}, _id )
			).resolves.toBe( false ) ) ),
			// Other elements
			...( [
				'testHeading1', 'testHeading2', 'testHeading3',
				'testHeading4', 'testHeading5', 'testHeading6',
				'testHeading7', 'testHeading8', 'testHeading9'
			].map( ( _id ) => expect(
				page.evaluate( async ( id ) => {
					const currentPage = await window.deputy.DeputyCasePage.build();
					return currentPage.isContributionSurveyHeading(
						document.getElementById( id )
					);
				}, _id )
			).resolves.toBe( false ) ) )
		] );
	} );

	test( 'findFirstContributionSurveyHeading', async () => {
		const _targetId = `i-${Math.random().toFixed( 8 ).slice( 2 )}`;

		await page.evaluate( ( targetId ) => {
			( document.getElementById( 'testHeading1' ).nextElementSibling as HTMLElement )
				.setAttribute(
					'data-deputy-test',
					targetId
				);
		}, _targetId );

		await expect(
			page.evaluate(
				async () => ( await window.deputy.DeputyCasePage.build() )
					.findFirstContributionSurveyHeadingElement()
					.getAttribute( 'data-deputy-test' )
			)
		).resolves.toBe( _targetId );
	} );

	test( 'findContributionSurveyHeadings', async () => {
		await expect(
			page.evaluate(
				async () => ( await window.deputy.DeputyCasePage.build() )
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
		].map( ( _id ) => expect(
			page.evaluate( async ( id ) => {
				const currentPage = await window.deputy.DeputyCasePage.build();
				return currentPage.getContributionSurveySection(
					document.getElementById( id ).nextElementSibling as HTMLElement
				).filter( ( v ) => v instanceof HTMLElement && v.tagName === 'UL' ).length;
			}, _id )
		).resolves.toBe( 1 ) ) );
	} );

	describe( 'DeputyCasePageWikitext implementation unit tests', () => {

		test( 'getWikitext', async () => {
			await expect(
				page.evaluate( async () => {
					const currentPage = await window.deputy.DeputyCasePage.build();
					return currentPage.wikitext.getWikitext();
				} )
			).resolves.toBeTruthy();
		} );

		test( 'getSectionWikitext (number)', async () => {
			await Promise.all( [
				expect(
					page.evaluate( async () => {
						const currentPage = await window.deputy.DeputyCasePage.build();
						return ( await currentPage.wikitext.getSectionWikitext( 0 ) )
							.toString();
					} )
				).resolves.toContain( '{{anchor|top}}' ),
				expect(
					page.evaluate( async () => {
						const currentPage = await window.deputy.DeputyCasePage.build();
						return ( await currentPage.wikitext.getSectionWikitext( 2 ) )
							.toString();
					} )
				).resolves.toContain( 'Examine the article or the diffs linked below' )
			] );
		} );

		test( 'getSectionWikitext (string)', async () => {
			await Promise.all( [
				expect(
					page.evaluate( async () => {
						const currentPage = await window.deputy.DeputyCasePage.build();
						return ( await currentPage.wikitext.getSectionWikitext( 'Text' ) )
							.toString();
					} )
				).resolves.toContain( 'Examine the article or the diffs linked below' ),
				expect(
					page.evaluate( async () => {
						const currentPage = await window.deputy.DeputyCasePage.build();
						return ( await currentPage.wikitext.getSectionWikitext( 'Pages 1 to 20' ) )
							.toString();
					} )
				).resolves.toContain( 'Special:Diff' )
			] );
		} );

	} );

} );

// TODO: Tests for Parsoid-based DeputyCasePage
