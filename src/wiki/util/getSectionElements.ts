import isSectionHeading from './isSectionHeading';

/**
 * Finds section elements from a given section heading (and optionally a predicate)
 *
 * @param sectionHeading
 * @param sectionHeadingPredicate
 * @return Section headings.
 */
export default function getSectionElements(
	sectionHeading: HTMLElement,
	sectionHeadingPredicate: ( el: HTMLElement ) => boolean = isSectionHeading
): HTMLElement[] {
	const sectionMembers: HTMLElement[] = [];

	let nextSibling = sectionHeading.nextElementSibling as HTMLElement;
	while ( nextSibling != null && !sectionHeadingPredicate( nextSibling ) ) {
		sectionMembers.push( nextSibling );
		nextSibling = nextSibling.nextElementSibling as HTMLElement;
	}

	return sectionMembers;
}
