import loadWikipediaPage from '../util/loadWikipediaPage';
import loadDeputyScript from '../util/loadDeputyScript';
import { jest } from '@jest/globals';
import '../../src/types';

describe( 'Utility function tests', () => {

	beforeAll( async () => {
		await loadWikipediaPage( 'Wikipedia:Sandbox' );
		await loadDeputyScript();

		jest.setTimeout( 10e3 );
	}, 30e3 );

	test( 'normalizeTitle', async () => {
		await Promise.all( [
			// Default test
			expect(
				page.evaluate( () => {
					return { ...window.deputy.util.normalizeTitle() };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 4, title: 'Sandbox'
			} ),

			// String parse test (mainspace)
			expect(
				page.evaluate( () => {
					return { ...window.deputy.util.normalizeTitle(
						'Main Page'
					) };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 0, title: 'Main_Page'
			} ),

			// String parse test (project space)
			expect(
				page.evaluate( () => {
					return { ...window.deputy.util.normalizeTitle(
						'Wikipedia:Contributor copyright investigations'
					) };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 4, title: 'Contributor_copyright_investigations'
			} ),

			// String parse test (subpage)
			expect(
				page.evaluate( () => {
					return { ...window.deputy.util.normalizeTitle(
						'Wikipedia:Contributor copyright investigations/Example'
					) };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 4, title: 'Contributor_copyright_investigations/Example'
			} ),

			// String parse test (fragment)
			expect(
				page.evaluate( () => {
					return { ...window.deputy.util.normalizeTitle(
						'Wikipedia:Contributor copyright investigations#Requests'
					) };
				} )
			).resolves.toEqual( {
				fragment: 'Requests', namespace: 4, title: 'Contributor_copyright_investigations'
			} ),

			// mw.Title test
			expect(
				page.evaluate( () => {
					return { ...window.deputy.util.normalizeTitle(
						new mw.Title( 'Main Page' )
					) };
				} )
			).resolves.toEqual( {
				fragment: null, namespace: 0, title: 'Main_Page'
			} )
		] );
	} );

} );
