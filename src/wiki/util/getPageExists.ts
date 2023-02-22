import MwApi from '../../MwApi';
import toRedirectsObject from './toRedirectsObject';
import { ArrayOrNot } from '../../types';

/**
 * From a list of page titles, get which pages exist.
 *
 * @param pages The pages to search for
 * @return An array of pages which exist, ordered by input order.
 */
export default async function ( pages: ArrayOrNot<string | mw.Title> ): Promise<string[]> {
	if ( !Array.isArray( pages ) ) {
		pages = [ pages ];
	}
	const pageNames: string[] = pages
		.map( p => p instanceof mw.Title ? p.getPrefixedText() : p );

	const pageRequest = ( await MwApi.action.get( {
		action: 'query',
		titles: pageNames.join( '|' )
	} ) ).query;

	const existingPages = [];

	if ( pageRequest.query.pages.length > 0 ) {
		const redirects = toRedirectsObject( pageRequest.redirects, pageRequest.normalized );
		const pageMap = Object.fromEntries(
			pageRequest.query.pages.map(
				( v: { title: string, missing?: boolean } ) => [ v.title, !v.missing ]
			)
		);

		// Use `pages` to retain client order (assume MW response can be tampered with)
		for ( const loc of pageNames ) {
			const actualLocation = redirects[ loc ] ?? loc;
			if ( pageMap[ actualLocation ] ) {
				existingPages.push( pageMap[ actualLocation ] );
			}
		}
	}

	return existingPages;
}
