import { ContributionSurveyHeading } from '../DeputyCasePage';
import error from '../../util/error';

/**
 * @param element The element to get the name of
 * @return the ID of the section heading.
 */
export default function sectionHeadingId( element: ContributionSurveyHeading ): string {
	try {
		return element.querySelector<HTMLElement>( '.mw-headline' )
			.getAttribute( 'id' );
	} catch ( e ) {
		error( 'Error getting section heading ID', e, element );
		throw e;
	}
}
