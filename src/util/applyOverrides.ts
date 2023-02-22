/**
 * Applies configuration overrides. This takes two objects, A and B.
 * A's keys will be respected and will remain unchanged. Object
 * values of A that also exist in B will be overwritten with its
 * values in B.
 *
 * @param data
 * @param overrides
 * @param logger
 */
export default function applyOverrides(
	data: Record<string, any>,
	overrides: Record<string, any>,
	logger?: ( key: string, oldVal: any, newVal: any ) => void
) {
	if ( overrides ) {
		for ( const category of Object.keys( data ) ) {
			if ( !overrides[ category ] ) {
				return; // Category does not exist.
			}
			for (
				const categoryKey of
				Object.keys( overrides[ category ] )
			) {
				if ( logger ) {
					logger(
						`${category}.${categoryKey}`,
						data[ category ][ categoryKey ],
						overrides[ category ][ categoryKey ]
					);
				}
				data[ category ][ categoryKey ] =
					overrides[ category ][ categoryKey ];
			}
		}
	}
}
