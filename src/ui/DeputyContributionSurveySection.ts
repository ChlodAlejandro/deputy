import { ContributionSurveyHeading } from '../wiki/DeputyCasePage';

/**
 * The contribution survey section UI element. This includes a list of revisions
 * (which are {@link DeputyContributionSurveyRow} objects), a "close section"
 * checkbox, a "comments" input box (for additional comments when closing the
 * section), a "cancel" button and a "save" button.
 */
export default class DeputyContributionSurveySection implements DeputyUIElement {

	heading: HTMLHeadingElement;

	// UI elements (no OOUI types, fall back to `any`)
	container: HTMLElement;
	rows: HTMLElement;
	closingCheckbox: any;
	closingComments: any;
	cancelButton: any;
	saveButton: any;

	/**
	 * Creates a DeputyContributionSurveySection from a given heading.
	 *
	 * @param heading
	 */
	constructor( heading: ContributionSurveyHeading ) {
		this.heading = heading;
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		this.container = document.createElement( 'div' );
		this.container.classList.add( 'deputy', 'dp-cs-section' );

		this.rows = document.createElement( 'div' );

		this.container.appendChild( this.rows );
		return this.container;
	}

}
