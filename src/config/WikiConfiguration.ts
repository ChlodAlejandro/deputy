import MwApi from '../MwApi';
import toRedirectsObject from '../wiki/util/toRedirectsObject';
import normalizeTitle from '../wiki/util/normalizeTitle';
import ConfigurationBase from './ConfigurationBase';
import Setting from './Setting';
import { CopyrightProblemsResponse } from '../modules/ia/models/CopyrightProblemsResponse';

/**
 * Wiki-wide configuration. This is applied to all users of the wiki, and has
 * the potential to break things for EVERYONE if not set to proper values.
 *
 * As much as possible, the correct configuration location should be protected
 * to avoid vandalism or bad-faith changes.
 *
 * This configuration works if specific settings are set. In other words, some
 * features of Deputy are disabled unless Deputy has been configured. This is
 * to avoid messing with existing on-wiki processes.
 */
export default class WikiConfiguration extends ConfigurationBase {

	static readonly configVersion = 1;
	static readonly configLocations = [
		'MediaWiki:Deputy-config.json',
		// Prioritize interface protected page over Project namespace
		'User:Chlod/Scripts/Deputy/configuration.json',
		'Project:Deputy/configuration.json'
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

	public readonly core = {
		/**
		 * Numerical code that identifies this config version. Increments for every breaking
		 * configuration file change.
		 */
		configVersion: new Setting<number, number>( {
			defaultValue: WikiConfiguration.configVersion,
			displayOptions: { hidden: true },
			alwaysSave: true
		} )
	};

	public readonly cci = {
		enabled: new Setting<boolean, boolean>( {
			displayOptions: { type: 'checkbox' }
		} )
	};

	public readonly ante = {
		enabled: new Setting<boolean, boolean>( {
			displayOptions: { type: 'checkbox' }
		} )
	};

	public readonly ia = {
		enabled: new Setting<boolean, boolean>( {
			displayOptions: { type: 'checkbox' }
		} ),
		rootPage: new Setting<string, mw.Title>( {
			serialize: ( v ) => v.getPrefixedText(),
			deserialize: ( v ) => new mw.Title( v ),
			defaultValue: null,
			displayOptions: {
				type: 'page'
			}
		} ),
		// Figure out how to do l10n dates in this thing
		subpageFormat: new Setting<string, string>( {
			defaultValue: null,
			displayOptions: {
				type: 'text'
			}
		} ),
		// Figure out how to do l10n dates in this thing
		preloadFormat: new Setting<string, string>( {
			defaultValue: null,
			displayOptions: {
				type: 'code'
			}
		} ),
		responses: new Setting<CopyrightProblemsResponse[], CopyrightProblemsResponse[]>( {
			...Setting.basicSerializers,
			defaultValue: null,
			displayOptions: {
				type: 'unimplemented'
			}
		} )
	};

	public readonly all = { cci: this.cci, ante: this.ante, ia: this.ia };

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
		await MwApi.action.postWithEditToken( {
			action: 'edit',
			title: this.sourcePage.getPrefixedText(),
			text: JSON.stringify( this.all, null, '\t' )
		} );
	}

}
