import { h } from 'tsx-dom';
import type CopyrightProblemsListing from '../models/CopyrightProblemsListing';
import type CopyrightProblemsSession from '../models/CopyrightProblemsSession';

/**
 *
 * @param session
 * @param listing
 * @return An HTML element
 */
export default function ListingActionLink(
	session: CopyrightProblemsSession,
	listing: CopyrightProblemsListing,
): JSX.Element {
	return <div class="ia-listing-action">
		<span class="ia-listing-action--bracket">{
			mw.message( 'deputy.ia.listing.respondPre' ).text()
		}</span>
		<a
			class="ia-listing-action--link"
			role="button"
			href=""
			onClick={async () => {
				const range = await listing.getListingWikitextLines();
				const lines: string[] = [];

				( await listing.listingPage.getWikitext() )
					.split( '\n' )
					.forEach( ( line, index ) => {
						if ( index >= range.start && index <= range.end ) {
							lines.push( line );
						}
					} );

				console.log( lines.join( '\n' ) );
			}}
		>{mw.message( 'deputy.ia.listing.respond' ).text()}</a>
		<span class="ia-listing-action--bracket">{
			mw.message( 'deputy.ia.listing.respondPost' ).text()
		}</span>
	</div>;
}
