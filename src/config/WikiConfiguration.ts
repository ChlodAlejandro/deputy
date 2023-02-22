import MwApi from '../MwApi';
import toRedirectsObject from '../wiki/util/toRedirectsObject';
import normalizeTitle from '../wiki/util/normalizeTitle';
import ConfigurationBase from './ConfigurationBase';
import Setting from './Setting';
import { CopyrightProblemsResponse } from '../modules/ia/models/CopyrightProblemsResponse';
import equalTitle from '../util/equalTitle';
import WikiConfigurationEditIntro from '../ui/config/WikiConfigurationEditIntro';
import getPageContent from '../wiki/util/getPageContent';
import {
	batchListingPageWikitext,
	batchListingWikitext,
	collapseBottom,
	collapseTop, copyvioBottom, copyvioTop,
	listingWikitext
} from '../wiki/TemplatePolyfills';
import ConfigurationReloadBanner from '../ui/config/ConfigurationReloadBanner';

export type WikiPageConfiguration = {
	title: mw.Title,
	wt: string,
	editable: boolean
};

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

	// Used to avoid circular dependencies.
	static = WikiConfiguration;

	static readonly configVersion = 1;
	static readonly optionKey = 'userjs-deputy-wiki';
	static readonly configLocations = [
		'MediaWiki:Deputy-config.json',
		// Prioritize interface protected page over Project namespace
		'User:Chlod/Scripts/Deputy/configuration.json',
		'Project:Deputy/configuration.json'
	];

	/**
	 * Loads the configuration from a set of possible sources.
	 *
	 * @param sourcePage The specific page to load from
	 */
	static async load( sourcePage?: mw.Title ): Promise<WikiConfiguration> {
		if ( sourcePage ) {
			// Explicit source given. Do not load from local cache.
			return this.loadFromWiki( sourcePage );
		} else {
			return this.loadFromLocal();
		}
	}

	/**
	 * loads the wiki configuration from localStorage. This allows for faster loads at
	 * the expense of a (small) chance of outdated configuration.
	 */
	static async loadFromLocal(): Promise<WikiConfiguration> {
		let configPage;
		try {
			// If `mw.storage.get` returns `false` or `null`, it'll be thrown up.
			configPage = JSON.parse( mw.storage.get( WikiConfiguration.optionKey ) as string );
		} catch ( e ) {
			// Bad local! Switch to non-local.
			console.error( 'Failed to get Deputy wiki configuration', e );
			return this.loadFromWiki();
		}

		if ( configPage ) {
			return new WikiConfiguration(
				new mw.Title( configPage.title.title, configPage.title.namespace ),
				JSON.parse( configPage.wt ),
				configPage.editable
			);
		} else {
			return this.loadFromWiki();
		}
	}

	/**
	 * Loads the configuration from the current wiki.
	 *
	 * @param sourcePage The specific page to load from
	 */
	static async loadFromWiki( sourcePage?: mw.Title ): Promise<WikiConfiguration> {
		const configPage = sourcePage ? {
			title: sourcePage,
			...await ( async () => {
				const content = await getPageContent( sourcePage, {
					prop: 'revisions|info',
					intestactions: 'edit',
					fallbacktext: '{}'
				} );

				return {
					wt: content,
					editable: content.page.actions.edit
				};
			} )()
		} : await this.loadConfigurationWikitext();
		try {
			// Attempt save of configuration to local options (if not explicitly loaded)
			if ( sourcePage == null ) {
				mw.storage.set(
					WikiConfiguration.optionKey, JSON.stringify( configPage )
				);
			}

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
	 * Loads the wiki-wide configuration from a set of predefined locations.
	 * See {@link WikiConfiguration#configLocations} for a full list.
	 *
	 * @return The string text of the raw configuration, or `null` if a configuration was not found.
	 */
	static async loadConfigurationWikitext(): Promise<WikiPageConfiguration> {
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
		} ),
		lastEdited: new Setting<number, number>( {
			defaultValue: 0,
			displayOptions: { hidden: true },
			alwaysSave: true
		} ),
		dispatchRoot: new Setting<string, URL>( {
			serialize: ( v ) => v.href,
			deserialize: ( v ) => new URL( v ),
			defaultValue: new URL( 'https://deputy.toolforge.org/' ),
			displayOptions: { type: 'text' },
			alwaysSave: true
		} )
	};

	public readonly cci = {
		enabled: new Setting<boolean, boolean>( {
			defaultValue: false,
			displayOptions: { type: 'checkbox' }
		} ),
		rootPage: new Setting<string, mw.Title>( {
			serialize: ( v ) => v?.getPrefixedText(),
			deserialize: ( v ) => new mw.Title( v ),
			defaultValue: null,
			displayOptions: { type: 'page' }
		} ),
		collapseTop: new Setting<string, string>( {
			defaultValue: collapseTop,
			displayOptions: { type: 'code' }
		} ),
		collapseBottom: new Setting<string, string>( {
			defaultValue: collapseBottom,
			displayOptions: { type: 'code' }
		} ),
		earwigRoot: new Setting<string, URL>( {
			serialize: ( v ) => v.href,
			deserialize: ( v ) => new URL( v ),
			defaultValue: new URL( 'https://copyvios.toolforge.org/' ),
			displayOptions: { type: 'text' },
			alwaysSave: true
		} )
	};

	public readonly ante = {
		enabled: new Setting<boolean, boolean>( {
			defaultValue: false,
			displayOptions: { type: 'checkbox' }
		} )
	};

	public readonly ia = {
		enabled: new Setting<boolean, boolean>( {
			defaultValue: false,
			displayOptions: { type: 'checkbox' }
		} ),
		rootPage: new Setting<string, mw.Title>( {
			serialize: ( v ) => v?.getPrefixedText(),
			deserialize: ( v ) => new mw.Title( v ),
			defaultValue: null,
			displayOptions: { type: 'page' }
		} ),
		subpageFormat: new Setting<string, string>( {
			defaultValue: 'YYYY MMMM D',
			displayOptions: { type: 'text' }
		} ),
		preload: new Setting<string, string>( {
			serialize: ( v ) => ( v?.trim()?.length ?? 0 ) === 0 ? null : v.trim(),
			defaultValue: null,
			displayOptions: { type: 'page' }
		} ),
		allowPresumptive: new Setting<boolean, boolean>( {
			defaultValue: true,
			displayOptions: { type: 'checkbox' }
		} ),
		listingWikitext: new Setting<string, string>( {
			defaultValue: listingWikitext,
			displayOptions: { type: 'code' }
		} ),
		/**
		 * $1 - Title of the batch
		 * $2 - List of pages (newlines should be added in batchListingPageWikitext).
		 * $3 - User comment
		 */
		batchListingWikitext: new Setting<string, string>( {
			defaultValue: batchListingWikitext,
			displayOptions: { type: 'code' }
		} ),
		/**
		 * $1 - Page to include
		 */
		batchListingPageWikitext: new Setting<string, string>( {
			defaultValue: batchListingPageWikitext,
			displayOptions: { type: 'code' }
		} ),
		/**
		 * @see {@link CopyrightProblemsListing#articleCvRegex}
		 *
		 * This should match both normal and batch listings.
		 */
		listingWikitextMatch: new Setting<string, string>( {
			defaultValue: '(\\*\\s*)?\\[\\[([^\\]]+)\\]\\]',
			displayOptions: { type: 'code' }
		} ),
		hideTemplate: new Setting<string, string>( {
			defaultValue: copyvioTop,
			displayOptions: { type: 'code' }
		} ),
		hideTemplateBottom: new Setting<string, string>( {
			defaultValue: copyvioBottom,
			displayOptions: { type: 'code' }
		} ),
		responses: new Setting<CopyrightProblemsResponse[], CopyrightProblemsResponse[]>( {
			...Setting.basicSerializers,
			defaultValue: null,
			displayOptions: { type: 'unimplemented' }
		} )
	};

	readonly type = <const> 'wiki';
	public readonly all = { core: this.core, cci: this.cci, ante: this.ante, ia: this.ia };

	/**
	 * Set to true when this configuration is outdated based on latest data. Usually adds banners
	 * to UI interfaces saying a new version of the configuration is available, and that it should
	 * be used whenever possible.
	 *
	 * TODO: This doesn't do what the documentations says yet.
	 */
	public outdated = false;

	/**
	 *
	 * @param sourcePage
	 * @param serializedData
	 * @param editable Whether the configuration is editable by the current user or not.
	 */
	constructor(
		readonly sourcePage: mw.Title,
		readonly serializedData: any,
		readonly editable?: boolean
	) {
		super();
		if ( serializedData ) {
			this.deserialize( serializedData );
		}

		if ( window.deputy?.comms ) {
			// Communications is available. Register a listener.
			window.deputy.comms.addEventListener( 'wikiConfigUpdate', ( e ) => {
				this.update( Object.assign( {}, e.data.config, {
					title: normalizeTitle( e.data.config.title )
				} ) );
			} );
		}
	}

	/**
	 * Check for local updates, and update the local configuration as needed.
	 *
	 * @param sourceConfig A serialized version of the configuration based on a wiki
	 * page configuration load.
	 */
	async update( sourceConfig?: WikiPageConfiguration ): Promise<void> {
		// Asynchronously load from the wiki.
		let fromWiki: WikiPageConfiguration;
		if ( sourceConfig ) {
			fromWiki = sourceConfig;
		} else {
			// Asynchronously load from the wiki.
			fromWiki = await WikiConfiguration.loadConfigurationWikitext();

			if ( fromWiki == null ) {
				// No configuration found on the wiki.
				return;
			}
		}
		const liveWikiConfig = JSON.parse( fromWiki.wt );

		// Attempt save if on-wiki config found and doesn't match local.
		// Doesn't need to be from the same config page, since this usually means a new config
		// page was made, and we need to switch to it.
		if ( this.core.lastEdited < liveWikiConfig.lastEdited ) {
			const onSuccess = () => {
				// Only mark outdated after saving, so we don't indirectly cause a save operation
				// to cancel.
				this.outdated = true;

				// Attempt to add site notice.
				if ( document.querySelector( '.dp-wikiConfigUpdateMessage' ) == null ) {
					document.getElementById( 'siteNotice' )?.insertAdjacentElement(
						'afterend',
						ConfigurationReloadBanner()
					);
				}
			};

			// If updated from a source config (other Deputy tab), do not attempt to save
			// to MediaWiki settings. This is most likely already saved by the original tab
			// that sent the comms message.
			if ( !sourceConfig ) {
				MwApi.action.saveOption(
					WikiConfiguration.optionKey,
					// Use `liveWikiConfig`, since this contains the compressed version and is more
					// bandwidth-friendly.
					JSON.stringify( {
						title: fromWiki.title,
						editable: fromWiki.editable,
						wt: liveWikiConfig
					} )
				).then( () => {
					if ( window.deputy?.comms ) {
						// Broadcast the update to other tabs.
						window.deputy.comms.send( {
							type: 'wikiConfigUpdate',
							config: {
								title: fromWiki.title.getPrefixedText(),
								editable: fromWiki.editable,
								wt: liveWikiConfig
							}
						} );
					}
					onSuccess();
				} ).catch( () => {
					// silently fail
				} );
			} else {
				onSuccess();
			}
		}
	}

	/**
	 * Saves the configuration on-wiki. Does not automatically generate overrides.
	 */
	async save(): Promise<void> {
		// Update last edited number
		this.core.lastEdited.set( Date.now() );
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
