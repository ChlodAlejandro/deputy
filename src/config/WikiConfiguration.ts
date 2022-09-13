import MwApi from '../MwApi';
import toRedirectsObject from '../wiki/util/toRedirectsObject';
import normalizeTitle from '../wiki/util/normalizeTitle';

/**
 *
 */
export default class WikiConfiguration {

	static readonly configLocations = [
		'MediaWiki:Deputy-config.json',
		'Project:Deputy/configuration.json',
		'User:Chlod/Scripts/Deputy/configuration.json'
	];

	/**
	 * Loads the wiki-wide configuration from a set of predefined locations.
	 * See {@link WikiConfiguration#configLocations} for a full list.
	 *
	 * @return The string text of the raw configuration, or `null` if a configuration was not found.
	 */
	async loadRawConfiguration(): Promise<string> {
		const response = await MwApi.action.get( {
			action: 'query',
			prop: 'revisions',
			rvprop: 'content',
			rvslots: 'main',
			rvlimit: 1,
			redirects: true,
			titles: WikiConfiguration.configLocations.join( '|' )
		} );

		const redirects = toRedirectsObject( response.query.redirects );

		for ( const page of WikiConfiguration.configLocations ) {
			const title = normalizeTitle(
				redirects[ page ] || page
			).getPrefixedText();

			const pageInfo = response.query.pages.find(
				( p: { ns: number, title: string } ) => p.title === title
			);
			if ( !pageInfo.missing ) {
				return pageInfo.revisions[ 0 ].slots.main.content;
			}
		}

		return null;
	}

}
