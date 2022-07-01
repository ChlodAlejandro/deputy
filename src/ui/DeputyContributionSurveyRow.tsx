import { h } from 'tsx-dom';
import DeputyContributionSurveySection from './DeputyContributionSurveySection';
import { DeputyUIElement } from './DeputyUIElement';
import ContributionSurveyRow from '../models/ContributionSurveyRow';
import swapElements from '../util/swapElements';

/**
 * A specific revision for a section row.
 */
export class DeputyContributionSurveyRowRevision extends EventTarget {

}

/**
 * A UI element used for denoting the following aspects of a page in the contribution
 * survey:
 * (a) the current status of the page (violations found, no violations found, unchecked, etc.)
 * (b) the name of the page
 * (c) special page tags
 * (d) the number of edits within that specific row
 * (e) the byte size of the largest-change diff
 * (f) a list of revisions related to this page (as DeputyContributionSurveyRowRevision classes)
 * (g) closing comments
 */
export default class DeputyContributionSurveyRow implements DeputyUIElement {

	/**
	 * The section that this row belongs to
	 */
	section: DeputyContributionSurveySection;
	/**
	 * The contribution survey row data
	 */
	row: Promise<ContributionSurveyRow>;

	/**
	 * This row's main root element. Does not get swapped.
	 */
	rootElement: HTMLElement;
	/**
	 * This row's content element. Gets swapped when loaded.
	 */
	element: HTMLElement;

	/**
	 * The page's status dropdown.
	 */
	statusDropdown: any;

	/**
	 * Creates a new DeputyContributionSurveyRow object.
	 *
	 * @param row The contribution survey row data
	 * @param section The section that this row belongs to
	 */
	constructor( row: Promise<ContributionSurveyRow>, section: DeputyContributionSurveySection ) {
		this.row = row;
		this.section = section;
	}

	/**
	 * Load the revision data in and change the UI element respectively.
	 */
	async loadData() {
		const csRow = await this.row;

		// TODO: Continue work here.
		this.element = swapElements(
			this.element, <div>
				{ csRow.title.getPrefixedText() }
			</div> as HTMLElement
		);
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		this.element = <div class="dp-cs-row--loading">
			<span class="dp-loadingDots-1" />
			<span class="dp-loadingDots-2"/>
			<span class="dp-loadingDots-3"/>
		</div> as HTMLElement;
		this.rootElement = <div class="dp-cs-row">
			{ this.element }
		</div> as HTMLElement;

		this.loadData();

		return this.rootElement;
	}

}
