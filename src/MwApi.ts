/**
 *
 */
export default class MwApi {

	private static _action: mw.Api;
	private static _rest: mw.Rest;

	/**
	 * @return A mw.Api for the current wiki.
	 */
	static get action(): mw.Api {
		return this._action ?? ( this._action = new mw.Api( {
			parameters: {
				format: 'json',
				formatversion: 2,
				utf8: 1,
				errorformat: 'html',
				errorlang: mw.config.get( 'wgUserLanguage' ),
				errorsuselocal: true
			}
		} ) );
	}

	/**
	 * @return A mw.Rest for the current wiki.
	 */
	static get rest(): mw.Rest {
		return this._rest ?? ( this._rest = new mw.Rest() );
	}

}
