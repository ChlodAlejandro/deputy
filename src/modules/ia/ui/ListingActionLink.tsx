import { h } from 'tsx-dom';
import type CopyrightProblemsListing from '../models/CopyrightProblemsListing';

/**
 *
 * @param listing
 * @return An HTML element
 */
export default function ListingActionLink(
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
			onClick={() => {
				// TODO: Spawn ListingResponseDialog
				listing.element.parentElement.style.backgroundColor =
					'#ffd36c';
			}}
		>{mw.message( 'deputy.ia.listing.respond' ).text()}</a>
		<span class="ia-listing-action--bracket">{
			mw.message( 'deputy.ia.listing.respondPost' ).text()
		}</span>
	</div>;
}
