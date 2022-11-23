import { ContributionSurveyHeading } from '../DeputyCasePage';

/**
 * @param element The element to get the name of
 * @return the ID of the section heading.
 */
export default function sectionHeadingId( element: ContributionSurveyHeading ): string {
	try {
		return element.querySelector<HTMLElement>( '.mw-headline' )
			.getAttribute( 'id' );
	} catch ( e ) {
		console.error( 'Error getting section heading ID', e, element );
		throw e;
	}
}
