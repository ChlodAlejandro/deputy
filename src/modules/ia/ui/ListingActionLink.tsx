import { h } from 'tsx-dom';
import type CopyrightProblemsListing from '../models/CopyrightProblemsListing';
import type CopyrightProblemsSession from '../models/CopyrightProblemsSession';
import ListingResponsePanel from './ListingResponsePanel';

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
	const element = <div class="ia-listing-action">
		<span class="ia-listing-action--bracket">{
			mw.message( 'deputy.ia.listing.respondPre' ).text()
		}</span>
		<a
			class="ia-listing-action--link"
			role="button"
			href=""
			onClick={async ( event: MouseEvent ) => {
				const target = ( event.currentTarget as HTMLElement );
				target.toggleAttribute(
					'disabled', true
				);

				mw.loader.using( window.InfringementAssistant.static.dependencies, () => {
					const panel = new ListingResponsePanel( element, listing );
					listing.element.parentElement.appendChild( panel.render() );
					element.style.display = 'none';
					panel.addEventListener( 'close', () => {
						element.style.display = '';
					} );
					target.toggleAttribute(
						'disabled', false
					);
				} );
			}}
		>{mw.message( 'deputy.ia.listing.respond' ).text()}</a>
		<span class="ia-listing-action--bracket">{
			mw.message( 'deputy.ia.listing.respondPost' ).text()
		}</span>
	</div> as HTMLElement;

	return element;
}
