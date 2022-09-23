import MwApi from '../MwApi';
import toRedirectsObject from '../wiki/util/toRedirectsObject';
import normalizeTitle from '../wiki/util/normalizeTitle';
import ConfigurationBase from './ConfigurationBase';
import Setting from './Setting';
import { CopyrightProblemsResponse } from '../modules/ia/models/CopyrightProblemsResponse';
import equalTitle from '../util/equalTitle';
import WikiConfigurationEditIntro from '../ui/config/WikiConfigurationEditIntro';
import getPageContent from '../wiki/util/getPageContent';

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

	// uUed to avoid circular dependencies.
	static = WikiConfiguration;

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
	static async loadConfigurationWikitext(): Promise<{
		title: mw.Title,
		wt: string,
		editable: boolean
	}> {
		const response = await MwApi.action.get( {
			action: 'query',
			prop: 'revisions|info',
			rvprop: 'content',
			rvslots: 'main',
			rvlimit: 1,
			intestactions: 'edit',
			redirects: true,
			titles: WikiConfiguration.configLocations.join( '|' )
		} );

		const redirects = toRedirectsObject( response.query.redirects, response.query.normalized );
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
					wt: pageInfo.revisions[ 0 ].slots.main.content,
					editable: pageInfo.actions.edit
				};
			}
		}

		return null;
	}

	/**
	 * Loads the configuration from a set of possible sources.
	 *
	 * @param sourcePage The specific page to load from
	 */
	static async load( sourcePage?: mw.Title ): Promise<WikiConfiguration> {
		const configPage = sourcePage ? {
			title: sourcePage,
			...await ( async () => {
				const content = await getPageContent( sourcePage, {
					prop: 'revisions|info',
					intestactions: 'edit'
				} );

				return {
					wt: content,
					editable: content.page.actions.edit
				};
			} )()
		} : await this.loadConfigurationWikitext();
		try {
			return new WikiConfiguration(
				configPage.title,
				JSON.parse( configPage.wt ),
				configPage.editable
			);
		} catch ( e ) {
			console.error( e, configPage );
			mw.hook( 'deputy.i18nDone' ).add( function notifyConfigFailure() {
				mw.notify( mw.msg( 'deputy.loadError.wikiConfig' ), {
					type: 'error'
				} );
				mw.hook( 'deputy.i18nDone' ).remove( notifyConfigFailure );
			} );
			return null;
		}
	}

	/**
	 * Check if the current page being viewed is a valid configuration page.
	 *
	 * @param page
	 * @return `true` if the current page is a valid configuration page.
	 */
	static isConfigurationPage( page?: mw.Title ): boolean {
		if ( page == null ) {
			page = new mw.Title( mw.config.get( 'wgPageName' ) );
		}

		return this.configLocations.some(
			( v ) => equalTitle( page, normalizeTitle( v ) )
		);
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
		subpageFormat: new Setting<string, string>( {
			defaultValue: null,
			displayOptions: {
				type: 'text'
			}
		} ),
		preload: new Setting<string, string>( {
			serialize: ( v ) => v.trim().length === 0 ? null : v.trim(),
			defaultValue: null,
			displayOptions: {
				type: 'page'
			}
		} ),
		/**
		 * @see {@link CopyrightProblemsListing#articleCvRegex}
		 */
		listingWikitextMatch: new Setting<string, string>( {
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
	 * @param editable Whether the configuration is editable by the current user or not.
	 */
	constructor( readonly sourcePage: mw.Title, serializedData: any, readonly editable?: boolean ) {
		super();
		if ( serializedData ) {
			this.deserialize( serializedData );
		}
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

	/**
	 * Check if the current page being viewed is the active configuration page.
	 *
	 * @param page
	 * @return `true` if the current page is the active configuration page.
	 */
	onConfigurationPage( page?: mw.Title ): boolean {
		return equalTitle( page ?? mw.config.get( 'wgPageName' ), this.sourcePage );
	}

	/**
	 * Actually displays the banner which allows an editor to modify the configuration.
	 */
	async displayEditBanner(): Promise<void> {
		mw.loader.using( [ 'oojs', 'oojs-ui' ], () => {
			if ( document.getElementsByClassName( 'deputy-wikiConfig-intro' ).length > 0 ) {
				return;
			}

			document.getElementById( 'mw-content-text' ).insertAdjacentElement(
				'afterbegin', WikiConfigurationEditIntro( this )
			);
		} );
	}

	/**
	 * Shows the configuration edit intro banner, if applicable on this page.
	 */
	async prepareEditBanners(): Promise<void> {
		if ( [ 'view', 'diff' ].indexOf( mw.config.get( 'wgAction' ) ) === -1 ) {
			return;
		}
		if ( document.getElementsByClassName( 'deputy-wikiConfig-intro' ).length > 0 ) {
			return;
		}

		if ( this.onConfigurationPage() ) {
			return this.displayEditBanner();
		} else if ( WikiConfiguration.isConfigurationPage() ) {
			return this.displayEditBanner();
		}
	}

}
