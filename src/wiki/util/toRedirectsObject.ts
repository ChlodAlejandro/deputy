/**
 * Transforms the `redirects` object returned by MediaWiki's `query` action into an
 * object instead of an array.
 *
 * @param redirects
 * @param normalized
 * @return Redirects as an object
 */
export default function toRedirectsObject(
	redirects: { from: string, to: string }[],
	normalized?: { from: string, to: string }[]
): Record<string, string> {
	if ( redirects == null ) {
		return {};
	}

	const out: Record<string, string> = {};

	for ( const redirect of redirects ) {
		out[ redirect.from ] = redirect.to;
	}
	// Single-level redirect-normalize loop check
	for ( const normal of normalized ) {
		out[ normal.from ] = out[ normal.to ] ?? normal.to;
	}

	return out;
}
