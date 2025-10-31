/**
 * A MediaWiki section.
 */
export interface Section {
	/** The section's positional index. */
	i: number;
	toclevel: number;
	level: string;
	/** Actual section title */
	line: string;
	/** The TOC number of this section. */
	number: string;
	index: string;
	byteoffset: number | null;
	/** Anchor that links to this section */
	anchor: string;
	/** Page that contains this section, if not on the current page. */
	fromtitle?: string;
}

export interface SinglePageWorkflowDialogResponseData {
	entirePage: boolean;

	startSection?: Section;
	endSection?: Section;
	startOffset?: number;
	endOffset?: number;

	/**
	 * Determines whether sources are used entirely. If true, sources are NOT
	 * used. If false, sources are used. This also changes used content strings.
	 */
	presumptive: boolean;
	presumptiveCase: string;

	/**
	 * Determines which source mode to use. If `fromUrls` is true, `sourceUrls` will be
	 * used for the source. Otherwise, `sourceText` is used.
	 */
	fromUrls: boolean;
	sourceUrls?: string[];
	sourceText: string;

	/**
	 * Additional notes.
	 */
	notes: string;
}
