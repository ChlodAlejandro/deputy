import { ExpandedRevisionData } from '../api/ExpandedRevisionData';
import ContributionSurveyRow from './ContributionSurveyRow';

/**
 * Contains information about a specific revision in a ContributionSurveyRow.
 */
export class ContributionSurveyRevision implements ExpandedRevisionData {

	/** @inheritDoc */ revid: number;
	/** @inheritDoc */ parentid: number;
	/** @inheritDoc */ minor: boolean;
	/** @inheritDoc */ user: string;
	/** @inheritDoc */ timestamp: string;
	/** @inheritDoc */ size: number;
	/** @inheritDoc */ comment: string;
	/** @inheritDoc */ tags: string[];
	/** @inheritDoc */ page: {
		pageid: number;
		ns: number;
		title: string;
	};
	/** @inheritDoc */ diffsize: number;
	/** @inheritDoc */ parsedcomment?: string;

	/**
	 * The row that this revision belongs to.
	 */
	row: ContributionSurveyRow;

	/**
	 * Creates a new ContributionSurveyRowRevision
	 *
	 * @param row
	 * @param revisionData
	 */
	constructor( row: ContributionSurveyRow, revisionData: ExpandedRevisionData ) {
		Object.assign( this, revisionData );
		this.row = row;
	}

}
