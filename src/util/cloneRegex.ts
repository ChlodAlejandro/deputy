/**
 * Clones a regular expression.
 *
 * @param regex The regular expression to clone.
 * @param options
 * @return A new regular expression object.
 */
export default function ( regex: RegExp, options: Partial<{
	pre: string,
	post: string,
	transformer?: ( source: string ) => string
}> = {} ): RegExp {
	return new RegExp(
		options.transformer ? options.transformer( regex.source ) :
			`${options.pre || ''}${regex.source}${options.post || ''}`,
		regex.flags
	);
}
