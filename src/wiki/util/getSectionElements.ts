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
	// Normalize "sectionHeading" to use the h* element and not the .mw-heading span.
	if ( !sectionHeadingPredicate( sectionHeading ) ) {
		if ( !sectionHeadingPredicate( sectionHeading.parentElement ) ) {
			throw new Error( 'Provided section heading is not a valid section heading.' );
		} else {
			sectionHeading = sectionHeading.parentElement;
		}
	}

	// When DiscussionTools is being used, the header is wrapped in a div.
	if ( sectionHeading.parentElement.classList.contains( 'mw-heading' ) ) {
		sectionHeading = sectionHeading.parentElement;
	}

	const sectionMembers: HTMLElement[] = [];

	let nextSibling = sectionHeading.nextElementSibling as HTMLElement;
	while ( nextSibling != null && !sectionHeadingPredicate( nextSibling ) ) {
		sectionMembers.push( nextSibling );
		nextSibling = nextSibling.nextElementSibling as HTMLElement;
	}

	return sectionMembers;
}
