/**
 * Data that constructs a raw contribution survey row.
 */
export interface RawContributionSurveyRow {
	type: 'detailed' | 'pageonly';
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
	 * the colon, depending on the year the case was opened, including the
	 * actual colon. In practice, this string contains any text between the page
	 * title and the diffs.
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

	// Non-raw string values:

	/**
	 * An array of all revision IDs parsed from the diffs.
	 */
	revids: number[];
}

/**
 * Parser for {@link ContributionSurveyRow}s.
 *
 * This is used directly in unit tests. Do not import unnecessary
 * dependencies, as they may indirectly import the entire Deputy
 * codebase outside a browser environment.
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

		const bullet = this.eatUntil( /^[^*\s]/g );

		if ( !bullet ) {
			throw new Error( 'dp-malformed-row' );
		}

		const creation = this.eatExpression( /^\s*'''N'''\s*/g ) != null;
		const page = this.eatExpression( /\[\[([^\]|]+)(?:\|.*)?]]/g, 1 );

		if ( !page ) {
			// Malformed or unparsable listing.
			throw new Error( 'dp-undetectable-page-name' );
		}

		let extras = this.eatUntil( /^\[\[Special:Diff\/\d+/, true );

		// At this point, `extras` is either a string or `null`. If it's a string,
		// extras exist, and we should add them. If not, there's likely no more
		// revisions to be processed here, and can assume that the rest is user comments.
		const revids: number[] = [];
		let diffs: string = null,
			comments: string;
		if ( extras ) {
			const starting = this.current;
			let diff: true | string = true;
			while ( diff ) {
				diff = this.eatExpression( /\[\[Special:Diff\/(\d+)(?:\|.*)?]]/g, 1 );
				if ( diff != null ) {
					revids.push( +diff );
				}
			}

			// All diff links removed. Get diff of starting and current to get entire diff part.
			diffs = starting.slice( 0, starting.length - this.current.length );
			// Comments should be empty, but just in case we do come across comments.
			comments = this.isEmpty() ? null : this.eatRemaining();
		} else {
			// Try to grab extras. This is done by detecting any form of parentheses and
			// matching them, including any possible included colon. If that doesn't work,
			// try pulling out just the colon.
			const maybeExtras = this.eatExpression(
				/\s*(?::\s*)?\(.+\)(?:\s*:)?\s*/
			) || this.eatExpression( /\s*:\s*/g );
			if ( maybeExtras ) {
				extras = maybeExtras;
			}

			// Only comments probably remain. Eat out whitespaces and the rest is a comment.
			extras = ( extras || '' ) + ( this.eatUntil( /^\S/g, true ) || '' );
			if ( extras === '' ) {
				extras = null;
			}

			comments = this.getCurrentLength() > 0 ? this.eatRemaining() : null;
		}

		return {
			type: ( extras || comments || diffs ) == null ? 'pageonly' : 'detailed',
			bullet,
			creation,
			page,
			extras,
			diffs,
			comments,
			revids
		};
	}

	/**
	 * Returns `true` if the working string is empty.
	 *
	 * @return `true` if the length of `current` is zero. `false` if otherwise.
	 */
	isEmpty(): boolean {
		return this.current.length === 0;
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
	 * will not be re-wrapped with `^(?:)`. These must be added on your own if
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
	 * with `^(?:<source>)`. Avoid adding these expressions on your own.
	 *
	 * @param pattern The pattern to match.
	 * @param n The capture group to return (returns the entire string (`0`) by default)
	 * @return The consumed characters.
	 */
	eatExpression( pattern: RegExp, n = 0 ): string {
		const expression = new RegExp(
			`^(?:${pattern.source})`,
			// Ban global and multiline, useless since this only matches once and to
			// ensure that the reading remains 'flat'.
			pattern.flags.replace( /[gm]/g, '' )
		);

		const match = expression.exec( this.current );
		if ( match ) {
			this.current = this.current.slice( match[ 0 ].length );
			return match[ n ];
		} else {
			return null;
		}
	}

	/**
	 * Consumes the rest of the working string.
	 *
	 * @return The remaining characters in the working string.
	 */
	eatRemaining(): string {
		const remaining = this.current;
		this.current = '';
		return remaining;
	}

}
