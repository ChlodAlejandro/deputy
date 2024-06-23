import isWikiHeading from './isWikiHeading';

/**
 * Finds section elements from a given section heading (and optionally a predicate)
 *
 * @param sectionHeading
 * @param sectionHeadingPredicate A function which returns `true` if the section should stop here
 * @return Section headings.
 */
export default function getSectionElements(
	sectionHeading: HTMLElement,
	sectionHeadingPredicate: ( el: HTMLElement ) => boolean = isWikiHeading
): HTMLElement[] {
	const sectionMembers: HTMLElement[] = [];

	let nextSibling = sectionHeading.nextElementSibling as HTMLElement;
	while ( nextSibling != null && !sectionHeadingPredicate( nextSibling ) ) {
		sectionMembers.push( nextSibling );
		nextSibling = nextSibling.nextElementSibling as HTMLElement;
	}

	return sectionMembers;
}
