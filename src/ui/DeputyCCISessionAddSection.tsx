import { h } from 'tsx-dom';
import '../types';
import DeputyCasePage, { ContributionSurveyHeading } from '../wiki/DeputyCasePage';
import unwrapWidget from '../util/unwrapWidget';
import removeElement from '../util/removeElement';

/**
 * Creates the "Start working on section" overlay over existing contribution survey
 * sections that are not upgraded.
 *
 * @param props
 * @param props.casePage
 * @param props.heading
 * @return HTML element
 */
export default function ( props: {
	casePage: DeputyCasePage,
	heading: ContributionSurveyHeading
} ): JSX.Element {
	const { casePage, heading } = props;
	const startButton = new OO.ui.ButtonWidget( {
		classes: [ 'dp-cs-section-addButton' ],
		icon: 'play',
		label: mw.message( 'deputy.session.add' ).text(),
		flags: [ 'primary', 'progressive' ]
	} );

	const element = <div class="dp-cs-section-add">
		{ unwrapWidget( startButton ) }
	</div> as HTMLElement;

	startButton.on( 'click', () => {
		// This element is automatically appended to the UL of the section, which is a no-no
		// for ContributionSurveySection. This sneakily removes this element before any sort
		// of activation is performed.
		removeElement( element );
		window.deputy.session.activateSection( casePage, heading );
	} );

	return element;

}
