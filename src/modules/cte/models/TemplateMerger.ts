import type CopiedTemplate from './templates/CopiedTemplate';

/**
 * Merges templates together. Its own class to avoid circular dependencies.
 */
export default class TemplateMerger {

	/**
	 * Merge an array of CopiedTemplates into one big CopiedTemplate. Other templates
	 * will be destroyed.
	 *
	 * @param templateList The list of templates to merge
	 * @param pivot The template to merge into. If not supplied, the first template
	 *              in the list will be used.
	 */
	static copied( templateList: CopiedTemplate[], pivot?: CopiedTemplate ) {
		pivot = pivot ?? templateList[ 0 ];
		while ( templateList.length > 0 ) {
			const template = templateList[ 0 ];
			if ( template !== pivot ) {
				pivot.merge( template, { delete: true } );
			}
			// Pop the pivot template out of the list.
			templateList.shift();
		}
	}

}
