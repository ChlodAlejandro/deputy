/**
 *
 */
export class DeputyPreferences {

	static readonly default = {
		configVersion: 0,
		lastVersion: '0.1.0',
		cci: {
			revisionDefault: 'expanded'
		}
	};

	/**
	 *
	 * @param id
	 */
	get( id: string ) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return DeputyPreferences.default[ id ];
	}

}
