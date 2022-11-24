interface EarwigDetectorOptions {
	language?: string;
	project?: string;
	useEngine?: boolean;
	useLinks?: boolean;
	turnItIn?: boolean;
}

/**
 * Utility class for generating URLs to Earwig's Copyvio Detector.
 */
export default class EarwigCopyvioDetector {

	static supportedLanguages: string[];
	static supportedProjects: string[];

	/**
	 * Guesses the current project and language.
	 *
	 * @param project
	 * @param language
	 * @return The (guessed) project and language
	 */
	private static guessProject(
		project?: string,
		language?: string
	): { project: string, language: string } {
		// Attempt to guess the language and project.
		const splitHost = window.location.host.split( '.' );
		if ( !project && splitHost[ splitHost.length - 2 ] ) {
			// Project (e.g. wikipedia)
			project = splitHost[ splitHost.length - 2 ];
		}
		if ( !language && splitHost[ splitHost.length - 3 ] ) {
			// Language (e.g. en)
			language = splitHost[ splitHost.length - 3 ];
		}

		return { project, language };
	}

	/**
	 * Get Earwig's Copyvio Detector's supported languages and projects.
	 */
	static async getSupported(): Promise<void> {
		if ( !!this.supportedLanguages && !!this.supportedProjects ) {
			// Already loaded.
			return;
		}

		const cachedSupportedRaw = window.sessionStorage.getItem( 'dp-earwig-supported' );
		if ( cachedSupportedRaw ) {
			const cachedSupported = JSON.parse( cachedSupportedRaw );
			this.supportedLanguages = cachedSupported.languages;
			this.supportedProjects = cachedSupported.projects;
		}

		const sites = await fetch(
			`${
				( await window.deputy.getWikiConfig() ).cci.earwigRoot.get()
			}/api.json?action=sites&version=1`
		)
			.then( ( r ) => r.json() );

		this.supportedLanguages = [];
		for ( const lang of sites.langs ) {
			this.supportedLanguages.push( lang[ 0 ] );
		}
		this.supportedProjects = [];
		for ( const project of sites.projects ) {
			this.supportedProjects.push( project[ 0 ] );
		}

		window.sessionStorage.setItem( 'dp-earwig-supported', JSON.stringify( {
			languages: this.supportedLanguages,
			projects: this.supportedProjects
		} ) );
	}

	/**
	 * Checks if this wiki is supported by Earwig's Copyvio Detector.
	 *
	 * @param _project The project to check for
	 * @param _language The language to check for
	 */
	static async supports( _project?: string, _language?: string ) {
		await this.getSupported();

		const { project, language } = this.guessProject( _project, _language );

		return EarwigCopyvioDetector.supportedProjects.indexOf( project ) !== -1 &&
			EarwigCopyvioDetector.supportedLanguages.indexOf( language ) !== -1;
	}

	/**
	 * Generates a URL for Earwig's Copyvio Detector.
	 *
	 * @param target
	 * @param options
	 * @return An Earwig Copyvio Detector execution URL. `null` if wiki is not supported.
	 */
	static async getUrl(
		target: mw.Title | number,
		options: EarwigDetectorOptions = {}
	): Promise<string | null> {
		if ( !( await this.supports() ) ) {
			return null;
		}

		const { project, language } = this.guessProject( options.project, options.language );

		return `${
			( await window.deputy.getWikiConfig() ).cci.earwigRoot.get()
		}?action=search&lang=${
			language
		}&project=${
			project
		}&${
			typeof target === 'number' ?
				'oldid=' + target :
				'title=' + target.getPrefixedText()
		}&use_engine=${
			( options.useEngine ?? true ) ? 1 : 0
		}&use_links=${
			( options.useLinks ?? true ) ? 1 : 0
		}&turnitin=${
			( options.turnItIn ?? false ) ? 1 : 0
		}`;
	}

}
