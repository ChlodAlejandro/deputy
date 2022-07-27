import normalizeTitle from './normalizeTitle';
import MwApi from '../MwApi';

/**
 * Get the ID of a section from its heading.
 *
 * @param page The page to check for
 * @param sectionName The section name to get the ID of
 */
export default async function ( page: mw.Title | string, sectionName: string ) {
	const parseRequest = await MwApi.action.get( {
		action: 'parse',
		page: normalizeTitle( page ).getPrefixedText(),
		prop: 'sections'
	} );

	if ( parseRequest.error ) {
		throw new Error( 'Error finding section ID: ' + parseRequest.error.info );
	}

	const indexSection = ( parseRequest.parse.sections as any[] )
		.find( ( section ) => section.line === sectionName );

	if ( indexSection ) {
		return isNaN( +indexSection.index ) ? null : +indexSection.index;
	} else {
		return null;
	}
}
