/**
 *
 */
export class DeputyPreferences {

	static readonly default = {
		configVersion: 0,
		lastVersion: '0.1.0',
		cci: {
			contentDefault: 'expanded'
		}
	};

	private preferences = DeputyPreferences.default;

	/**
	 * @param id
	 * @return value
	 */
	get( id: string ): any {
		const idParts = id.split( '.' );
		let current = this.preferences;
		for ( const part of idParts ) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			current = current?.[ part ] ?? null;
		}
		return current;
	}

}
