import last from '../../util/last';
import sectionHeadingId from './sectionHeadingId';

/**
 * Checks the n of a given element, that is to say the `n`th occurrence of a section
 * with this exact heading name in the entire page.
 *
 * This is purely string- and element-based, with no additional metadata or parsing
 * information required.
 *
 * This function detects the `n` using the following conditions:
 * - If the heading ID does not have an n suffix, the n is always 1.
 * - If the heading ID does have an n suffix, and the detected heading name does not end
 *   with a number, the n is always the last number on the ID.
 * - If the heading ID and heading name both end with a number,
 *   - The n is 1 if the ID has an equal number of ending number patterns (sequences of "_n",
 *     e.g. "_20_30_40" has three) with the heading name.
 *   - Otherwise, the n is the last number on the ID if the ID than the heading name.
 *
 * @param heading The heading to check
 * @param headingName The name of the heading to check
 * @return The n, a number
 */
export default function ( heading: HTMLHeadingElement, headingName: string ): number {
	try {

		const headingNameEndPattern = /(?:\s|_)*(\d+)/g;
		const headingIdEndPattern = /_(\d+)/g;

		const headingId = sectionHeadingId( heading );
		const headingIdMatches = headingId.match( headingIdEndPattern );
		const headingNameMatches = headingName.match( headingNameEndPattern );

		if ( headingIdMatches == null ) {
			return 1;
		} else if ( headingNameMatches == null ) {
			// Last number of the ID
			return +( headingIdEndPattern.exec( last( headingIdMatches ) )[ 1 ] );
		} else if ( headingIdMatches.length === headingNameMatches.length ) {
			return 1;
		} else {
			// Last number of the ID
			return +( headingIdEndPattern.exec( last( headingIdMatches ) )[ 1 ] );
		}
	} catch ( e ) {
		console.error( 'Error getting section number', e, heading );
		throw e;
	}
}
