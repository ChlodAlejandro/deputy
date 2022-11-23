import normalizeTitle from './normalizeTitle';
import MwApi from '../../MwApi';

/**
 * Get the ID of a section from its heading.
 *
 * @param page The page to check for
 * @param sectionName The section name to get the ID of
 * @param n The `n`th occurrence of a section with the same name
 */
export default async function (
	page: mw.Title | string,
	sectionName: string,
	n = 1
) {
	const parseRequest = await MwApi.action.get( {
		action: 'parse',
		page: normalizeTitle( page ).getPrefixedText(),
		prop: 'sections'
	} );

	if ( parseRequest.error ) {
		throw new Error( 'Error finding section ID: ' + parseRequest.error.info );
	}

	let indexSection;
	let currentN = 1;
	for ( const section of parseRequest.parse.sections as any[] ) {
		if ( section.line === sectionName ) {
			if ( currentN < n ) {
				currentN++;
			} else {
				indexSection = section;
				break;
			}
		}
	}

	if ( indexSection ) {
		return isNaN( +indexSection.index ) ? null : +indexSection.index;
	} else {
		return null;
	}
}
