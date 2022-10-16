/**
 * Data that constructs a raw contribution survey row.
 */
interface RawContributionSurveyRow {
	/**
	 * The bullet and all trailing whitespace. This matches the starting bullet
	 * (an asterisk) and the trailing whitespace. The whitespace is also included
	 * to avoid modifying rows that don't follow the format, as this needlessly
	 * modifies the rows.
	 *
	 * @example `"* "`
	 */
	bullet: string;
	/**
	 * `true` if one of the diffs include creation. This appends a `'''N''' ` at the
	 * start of the row text when built. The space is not removable (as it would cause
	 * issues with the link display to begin with).
	 */
	creation?: boolean;
	/**
	 * The page that the row refers to. This does not include the wikilink brackets.
	 * Page names include everything inside the brackets, meaning any leading
	 * colons from interwiki links or category/file links (e.g. `[[:Category:Foo]]`)
	 * are also included. The main {@link ContributionSurveyRow} class should be
	 * able to handle those page names.
	 *
	 * @example `"List of characters in the Breaking Bad franchise"`
	 */
	page: string;
	/**
	 * Extra information attached to the diff. This usually comes before or after
	 * the colon, depending on the year the case was opened. This also includes
	 * the actual colon. If the colon was not detected, this value is undefined
	 * and the extra text is assumed to be part of the user comments. If a diff
	 * link was encountered, however, all text between the page's closing link
	 * brackets and the diff's opening link brackets is considered extra text.
	 *
	 * @example `": (1 edits, 1 major, +10929)"`, `"(3 edits):"`
	 */
	extras?: string;
	/**
	 * A string containing all diff links in the row. This includes all opening and
	 * closing link brackets.
	 *
	 * @example `"[[Special:Diff/12345|(+420)]][[Special:Diff/12346|(+69)]]"`
	 */
	diffs?: string;
	/**
	 * The comments attached to the diff. This includes the comment in its
	 * entirety and the signature of the user. Leading space is not included.
	 *
	 * @example `"{{x}} [[User:Foo|Foo]] ([[User talk:Foo|talk]]) 00:00, 1 January 2000 (UTC)"`
	 */
	comments?: string;
}

/**
 * Parser for {@link ContributionSurveyRow}s.
 *
 * This is used directly in unit tests. Do not import unnecessary
 * dependencies, as they may indirectly import the entire Deputy
 * codebase outside of a browser environment.
 */
export default class ContributionSurveyRowParser {

	/** The current and actively-modified wikitext. Slowly sliced when parsing. */
	private current: string;

	/**
	 *
	 * @param wikitext
	 */
	constructor( readonly wikitext: string ) {
		this.current = wikitext;
	}

	/**
	 * Parses a wikitext contribution survey row into a {@link RawContributionSurveyRow}.
	 * If invalid, an Error is thrown with relevant information.
	 *
	 * @return Components of a parsed contribution survey row.
	 */
	parse(): RawContributionSurveyRow {
		this.current = this.wikitext;

		return {
			bullet: '*',
			page: 'test' // TODO: DO THIS!
		};
	}

	/**
	 * @return the length of the working string.
	 */
	getCurrentLength(): number {
		return this.current.length;
	}

	/**
	 * Views the next character to {@link ContributionSurveyRowParser#eat}.
	 *
	 * @return The first character of the working string.
	 */
	peek(): string {
		return this.current[ 0 ];
	}

	/**
	 * Pops the first character off the working string and returns it.
	 *
	 * @return First character of the working string, pre-mutation.
	 */
	eat(): string {
		const first = this.current[ 0 ];
		this.current = this.current.slice( 1 );
		return first;
	}

	/**
	 * Continue eating from the string until a string or regular expression
	 * is matched. Unlike {@link eatExpression}, passed regular expressions
	 * will not be re-wrapped with `^()`. These must be added on your own if
	 * you wish to match the start of the string.
	 *
	 * @param pattern The string or regular expression to match.
	 * @param noFinish If set to `true`, `null` will be returned instead if the
	 * pattern is never matched. The working string will be reset to its original
	 * state if this occurs. This prevents the function from being too greedy.
	 * @return The consumed characters.
	 */
	eatUntil( pattern: string | RegExp, noFinish?: boolean ): string {
		const starting = this.current;
		let consumed = '';

		while ( this.current.length > 0 ) {
			if ( typeof pattern === 'string' ) {
				if ( this.current.startsWith( pattern ) ) {
					return consumed;
				}
			} else {
				if ( pattern.test( this.current ) ) {
					return consumed;
				}
			}

			consumed += this.eat();
		}

		if ( noFinish && this.current.length === 0 ) {
			// We finished the string! Reset.
			this.current = starting;
			return null;
		} else {
			return consumed;
		}
	}

	/**
	 * Eats a given expression from the start of the working string. If the working
	 * string does not contain the given expression, `null` is returned (and not a
	 * blank string). Only eats once, so any expression must be greedy if different
	 * behavior is expected.
	 *
	 * The regular expression passed into this function is automatically re-wrapped
	 * with `^(<source>)`. Avoid adding these expressions on your own.
	 *
	 * @param pattern The pattern to match.
	 * @return The consumed characters.
	 */
	eatExpression( pattern: RegExp ): string {
		const expression = new RegExp(
			`^(${pattern.source})`,
			// Ban global and multiline, useless since this only matches once and to
			// ensure that the reading remains 'flat'.
			pattern.flags.replace( /[gm]/g, '' )
		);

		const match = expression.exec( this.current );
		if ( match ) {
			this.current = this.current.slice( match[ 0 ].length );
			return match[ 0 ];
		} else {
			return null;
		}
	}

}
