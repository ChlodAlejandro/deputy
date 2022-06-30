import { h } from 'tsx-dom';
import DeputyCasePage, { ContributionSurveyHeading } from '../wiki/DeputyCasePage';
import { DeputyUIElement } from './DeputyUIElement';

/**
 * The contribution survey section UI element. This includes a list of revisions
 * (which are {@link DeputyContributionSurveyRow} objects), a "close section"
 * checkbox, a "comments" input box (for additional comments when closing the
 * section), a "cancel" button and a "save" button.
 */
export default class DeputyContributionSurveySection implements DeputyUIElement {

	heading: HTMLHeadingElement;
	sectionElements: HTMLElement[];

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
	 * @param casePage
	 * @param heading
	 */
	constructor( casePage: DeputyCasePage, heading: ContributionSurveyHeading ) {
		this.heading = heading;
		this.sectionElements = casePage.getContributionSurveySection( heading );
	}

	/**
	 *
	 */
	prepare(): void {
		const firstList = this.sectionElements.find( ( el ) => el.tagName === 'UL' );
		firstList.parentElement.removeChild( firstList );
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		// this.container = document.createElement( 'div' );
		// this.container.classList.add( 'deputy', 'dp-cs-section' );
		//
		// this.rows = document.createElement( 'div' );
		//
		// this.container.appendChild( this.rows );
		// return this.container;
		return this.container = <div class="deputy dp-cs-section">
			{ this.rows = <div>

			</div> as HTMLElement }
			<div>
				<div>
					{ this.closingCheckbox = <input type="checkbox" /> }
					{ this.closingComments = <input type="text" /> }
				</div>
				<div>
					<button>Cancel</button>
					<button>Save</button>
				</div>
			</div>
		</div> as HTMLElement;
	}

}
