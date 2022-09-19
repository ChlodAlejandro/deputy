import MwApi from '../MwApi';
import toRedirectsObject from '../wiki/util/toRedirectsObject';
import normalizeTitle from '../wiki/util/normalizeTitle';
import ConfigurationBase from './ConfigurationBase';
import Setting from './Setting';
import { CopyrightProblemsResponse } from '../modules/ia/models/CopyrightProblemsResponse';

/**
 *
 */
export default class WikiConfiguration extends ConfigurationBase {

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
	static async loadConfigurationWikitext(): Promise<{ title: mw.Title, wt: string }> {
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
				return {
					title: normalizeTitle( pageInfo.title ),
					wt: pageInfo.revisions[ 0 ].slots.main.content
				};
			}
		}

		return null;
	}

	/**
	 * Loads the configuration from a set of possible sources.
	 */
	static async load(): Promise<WikiConfiguration> {
		const configPage = await this.loadConfigurationWikitext();
		try {
			return new WikiConfiguration( configPage.title, JSON.parse( configPage.wt ) );
		} catch ( e ) {
			console.error( e, configPage );
			mw.notify( mw.msg( 'deputy.loadError.wikiConfig' ), {
				type: 'error'
			} );
			return null;
		}
	}

	public readonly ia = {
		responses: new Setting<CopyrightProblemsResponse[], CopyrightProblemsResponse[]>( {
			...Setting.basicSerializers,
			defaultValue: null,
			displayOptions: {
				type: 'unimplemented'
			}
		} )
	};

	public readonly all: Record<string, Record<string, Setting<any, any>>>;

	/**
	 *
	 * @param sourcePage
	 * @param serializedData
	 */
	constructor( readonly sourcePage: mw.Title, serializedData: any ) {
		super( serializedData );
	}

	/**
	 * Saves the configuration on-wiki. Does not automatically generate overrides.
	 */
	async save(): Promise<void> {
		MwApi.action.postWithEditToken( {
			action: 'edit',
			title: this.sourcePage.getPrefixedText(),
			text: JSON.stringify( this.all, null, '\t' )
		} );
	}

}
