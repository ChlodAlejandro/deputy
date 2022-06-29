export interface RevisionData {
	revid: number,
	parentid: number,
	minor: boolean,
	user: string,
	timestamp: string,
	size: number,
	comment: string;
	tags: string[];
}

export interface ExpandedRevisionData extends RevisionData {
	page: {
		pageid: number,
		ns: number,
		title: string,
	}
	diffsize: number,
	parsedcomment?: string
}
