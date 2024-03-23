import '../../../src/types';
import 'types-mediawiki';
import BrowserHelper from '../../util/BrowserHelper';
import WikiConfiguration from '../../../src/config/WikiConfiguration';
import CopyrightProblemsListing, {
	SerializedCopyrightProblemsListingData
} from '../../../src/modules/ia/models/CopyrightProblemsListing';

describe( 'CopyrightProblemsPage tests', () => {

	let page: BrowserHelper;

	beforeAll( async () => {
		page = await BrowserHelper.build()
			.then( p => p.loadWikipediaPage(
				'User:Chlod/Scripts/Deputy/tests/Problems/UnitTests'
			) )
			.then( async p => ( <const>[ await p.evaluate( () => {
				// Override the IA root page
				const mockCPN = async () => {
					const config = await window.InfringementAssistant.getWikiConfig();
					config.ia.rootPage.set( new mw.Title(
						'User:Chlod/Scripts/Deputy/tests/Problems'
					) );
				};
				mw.hook( 'deputy.preload' ).add( mockCPN );
				mw.hook( 'infringementAssistant.preload' ).add( mockCPN );
			} ), p ] )[ 1 ] )
			.then( p => p.loadDeputyScript() )
			.then( async p => ( <const>[ await p.wait(
				() => p.evaluate(
					() => window.InfringementAssistant.session != null
				),
				30e3
			), p ] )[ 1 ] );
	}, 60e3 );

	afterAll( async () => {
		await page.close();
	} );

	test( 'session exists', async () => {
		expect( await page.evaluate( () => {
			console.log( 'a', window );
			return window.InfringementAssistant.session != null;
		} ) ).toBe( true );
	} );

	test( 'listings detected', async () => {
		expect( await page.evaluate( () => {
			return window.InfringementAssistant.session.listingMap.size;
		} ) ).toBe( 10 );
	} );

	const testListingPage = (
		listingPage: SerializedCopyrightProblemsListingData['listingPage']
	) => {
		expect( listingPage ).toHaveProperty( 'namespace', 2 );
		expect( listingPage ).toHaveProperty(
			'title',
			'Chlod/Scripts/Deputy/tests/Problems/UnitTests'
		);
		expect( listingPage ).toHaveProperty( 'fragment', null );
	};

	// `* {{subst:article-cv|Example1}} from somewhere ~~~~`
	test( 'listing', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 0 ].serialize();
		} );
		expect( listing.i ).toBe( 1 );
		expect( listing.id ).toBe( 'Example1' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example1' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 1 );
	} );

	// ```
	// * {{subst:article-cv|Example2}} from somewhere ~~~~
	// *: Comment ~~~~
	// ```
	test( 'listing with comment', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 1 ].serialize();
		} );
		expect( listing.i ).toBe( 1 );
		expect( listing.id ).toBe( 'Example2' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example2' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 2 );
	} );

	// ```
	// * {{subst:article-cv|Example3}} from somewhere ~~~~
	// *: Comment1 ~~~~
	// *:: Comment2 ~~~~
	// ```
	test( 'listing with nested comment', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 2 ].serialize();
		} );
		expect( listing.i ).toBe( 1 );
		expect( listing.id ).toBe( 'Example3' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example3' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 3 );
	} );

	// ```
	// * {{subst:article-cv|Example4}} from somewhere ~~~~
	// {{subst:CPC|c}}
	// *:: Comment 3 ~~~~
	// ```
	test( 'listing with resolution with reply', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 3 ].serialize();
		} );
		expect( listing.i ).toBe( 1 );
		expect( listing.id ).toBe( 'Example4' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example4' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 3 );
	} );

	// ```
	// * {{subst:article-cv|Example5}} from somewhere ~~~~
	// *:: Comment 4 ~~~~
	// {{subst:CPC|c}}
	// ```
	test( 'listing with resolution and comment', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 4 ].serialize();
		} );
		expect( listing.i ).toBe( 1 );
		expect( listing.id ).toBe( 'Example5' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example5' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 3 );
	} );

	// ```
	// * {{subst:article-cv|Example6}} from somewhere ~~~~
	// ** Comment 5 ~~~~
	// *** Comment 6 ~~~~
	// ```
	test( 'listing with bullet-based comments', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 5 ].serialize();
		} );
		expect( listing.i ).toBe( 1 );
		expect( listing.id ).toBe( 'Example6' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example6' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 3 );
	} );

	// ```
	// * {{subst:article-cv|Example7}} from somewhere ~~~~
	//
	//
	// ```
	test( 'listing with list break', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 6 ].serialize();
		} );
		expect( listing.i ).toBe( 1 );
		expect( listing.id ).toBe( 'Example7' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example7' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 1 );
	} );

	// ```
	// * {{subst:article-cv|Example8}} from somewhere ~~~~
	// ```
	test( 'edge: post-break listing', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 7 ].serialize();
		} );
		expect( listing.i ).toBe( 1 );
		expect( listing.id ).toBe( 'Example8' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example8' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 1 );
	} );

	// ```
	// * {{subst:article-cv|Example9}} from somewhere ~~~~
	// *: Comment 7 ~~~~
	// ::: Comment 8 ~~~~
	// ```
	test( 'edge: listing with broken (dl) comment thread', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 8 ].serialize();
		} );
		expect( listing.i ).toBe( 1 );
		expect( listing.id ).toBe( 'Example9' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example9' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 3 );
	} );

	// ```
	// * {{subst:article-cv|Example1}} from somewhere ~~~~
	// ```
	test( 'edge: post-break and duplicate listing', async () => {
		const listing: SerializedCopyrightProblemsListingData = await page.evaluate( () => {
			return window.InfringementAssistant.session.getListings()[ 9 ].serialize();
		} );
		expect( listing.i ).toBe( 2 );
		expect( listing.id ).toBe( 'Example1' );
		expect( listing.basic ).toBeFalsy();
		testListingPage( listing.listingPage );
		expect( listing.title ).toHaveProperty( 'namespace', 0 );
		expect( listing.title ).toHaveProperty( 'title', 'Example1' );
		expect( listing.title ).toHaveProperty( 'fragment', null );
		expect( ( listing.lines.end - listing.lines.start ) + 1 ).toBe( 1 );
	} );

} );
