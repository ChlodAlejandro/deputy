/**
 * Denotes a response on the Copyright Problems noticeboard.
 */
export interface CopyrightProblemsResponse {

	/**
	 * The wikitext to append to a response. The following substitution is
	 * performed using mw.util.format:
	 *
	 * - `$1`: Title of page to respond to
	 * - `$2`: User comments
	 *
	 * Since this is wikitext, you may use `~~~`, `~~~~`, and `~~~~~` to get bare signature,
	 * full signature, and timestamp. If you want to refer to the current user, use
	 * "{{subst:REVISIONUSER}}".
	 *
	 * @example "{{CPC|c|$2}}"
	 */
	template: string;

	/**
	 * The label of the response. This should either be a static string, or an object of locale
	 * codes mapped to translations of the label. Following the latter allows for translation, and
	 * is useful in cases where the user cannot speak the wiki's content language but wishes to make
	 * a report on a given wiki (e.g., an English Wikipedia user responding to a German Wikipedia
	 * listing).
	 *
	 * This is up to the wiki's discretion, and is not required. They may opt only to have one set
	 * of responses in the wiki's content language.
	 *
	 * @example `"Issue resolved."`
	 * @example `{ "en": "Issue resolved.", "de": "Problem gelöst." }`
	 */
	label: string | Record<string, string>;

	/**
	 * Whether this response is a closing response or not. Used to tweak the edit summary.
	 *
	 * @default true
	 */
	closing?: boolean;

}

export type CopyrightProblemsResponseSet = {
	[ key: string ]: CopyrightProblemsResponse | null
};
