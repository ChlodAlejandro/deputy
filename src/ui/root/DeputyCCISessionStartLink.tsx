import { h } from 'tsx-dom';
import DeputyCasePage from '../../wiki/DeputyCasePage';
import { WikiHeading } from '../../wiki/util/normalizeWikiHeading';

/**
 * The CCI session start link. Starts a CCI session when pressed.
 *
 * @param heading The heading to use as a basis
 * @param casePage If a DeputyCasePage is provided, a "continue" button will be shown instead.
 * @return The link element to be displayed
 */
export default function (
	heading: WikiHeading,
	casePage?: DeputyCasePage
): JSX.Element {
	return <span class="deputy dp-sessionStarter">
		<span class="dp-sessionStarter-bracket">[</span>
		<a onClick={ async () => {
			if ( casePage && casePage.lastActiveSections.length > 0 ) {
				const headingId = heading.id;
				if ( window.deputy.config.cci.openOldOnContinue.get() ) {
					if ( casePage.lastActiveSections.indexOf( headingId ) === -1 ) {
						await casePage.addActiveSection( headingId );
					}
					await window.deputy.session.DeputyRootSession.continueSession( casePage );
				} else {
					await window.deputy.session.DeputyRootSession.continueSession(
						casePage, [ headingId ]
					);
				}
			} else {
				await window.deputy.session.DeputyRootSession.startSession( heading.h );
			}
		} }>{
				mw.message(
					casePage && casePage.lastActiveSections.length > 0 ?
						'deputy.session.continue' :
						'deputy.session.start'
				).text()
			}</a>
		<span class="dp-sessionStarter-bracket">]</span>
	</span>;
}
