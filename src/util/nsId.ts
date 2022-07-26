/**
 * Gets the namespace ID from a canonical (not localized) namespace name.
 *
 * @param namespace The namespace to get
 * @return The namespace ID
 */
export default function nsId( namespace: string ): number {
	return mw.config.get( 'wgNamespaceIds' )[
		namespace.toLowerCase().replace( / /g, '_' )
	];
}
