import nsId from '../../../util/nsId';
import getObjectValues from '../../../util/getObjectValues';
import toRedirectsObject from '../../../util/toRedirectsObject';
import AttributionNotice from './AttributionNotice';
import CopiedTemplate from './CopiedTemplate';
import CopiedTemplatePage from '../ui/pages/CopiedTemplatePage';

/**
 * An object mapping notice types to their expected on-wiki page titles.
 */
export const attributionNoticeTemplatePages = {
	copied: 'Copied'
	// mergedFrom: 'Merged-from',
	// mergedTo: 'Merged-to',
	// translatedPage: 'Translated page',
	// backwardsCopy: 'Backwards copy'
};

/**
 * Supported attribution notice types, as a type.
 */
export type SupportedAttributionNoticeType = keyof typeof attributionNoticeTemplatePages;
type AttributionTemplateAliases = Record<SupportedAttributionNoticeType, mw.Title[]>;

/**
 * This class contains functions, utilities, and other variables that assist in connecting
 * attribution notice templates on-wiki and converting them into their AttributionNotice
 * counterparts.
 */
export default class WikiAttributionNotices {

	/**
	 * An object mapping all supported attribution notice templates to their template pages titles.
	 *
	 * TODO: l10n - Add ability to override template names/disable templates.
	 */
	static attributionNoticeTemplates: Record<SupportedAttributionNoticeType, mw.Title>;
	/**
	 * An object containing aliases of all supported attribution notices (as `mw.Title`s).
	 */
	static templateAliasCache: AttributionTemplateAliases;
	/**
	 * An object mapping the `getPrefixedDb` values of `templateAliasCache` to a notice type.
	 */
	static templateAliasKeymap: Record<string, SupportedAttributionNoticeType>;
	/**
	 * A regular expression that matches the `href` (link) of a valid attribution
	 * notice. Includes redirects.
	 */
	static templateAliasRegExp: RegExp;
	/**
	 * An object mapping notice types to their respective class.
	 */
	static readonly attributionNoticeClasses = <const>{
		copied: CopiedTemplate
		// TODO: Implement
		// mergedFrom: class Null {},
		// TODO: Implement
		// mergedTo: class Null {},
		// TODO: Implement
		// translatedPage: class Null {},
		// TODO: Implement
		// backwardsCopy: class Null {}
	};
	/**
	 * An object mapping notice types to their respective OOUI PageLayouts.
	 */
	static readonly attributionNoticeClassPages:
		Record<SupportedAttributionNoticeType, ( options: any ) => any> = {
			copied: CopiedTemplatePage
			// mergedFrom: null,
			// mergedTo: null,
			// translatedPage: null,
			// backwardsCopy: null
		};

	/**
	 * Initializes.
	 */
	static async init(): Promise<void> {
		const attributionNoticeTemplates: Record<string, mw.Title> = {};
		const templateAliasCache: Record<string, mw.Title[]> = {};
		for ( const key of Object.keys( attributionNoticeTemplatePages ) ) {
			attributionNoticeTemplates[ key ] = new mw.Title( key, nsId( 'template' ) );
			templateAliasCache[ key ] = [ attributionNoticeTemplates[ key ] ];
		}
		this.attributionNoticeTemplates = attributionNoticeTemplates as
			typeof WikiAttributionNotices.attributionNoticeTemplates;
		this.templateAliasCache = templateAliasCache as
			typeof WikiAttributionNotices.templateAliasCache;

		// templateAliasCache setup

		const aliasRequest = await window.deputy.wiki.get( {
			action: 'query',
			format: 'json',
			prop: 'linkshere',
			titles: getObjectValues( this.attributionNoticeTemplates )
				.map( ( v: mw.Title ) => v.getPrefixedText() )
				.join( '|' ),
			lhprop: 'title',
			lhnamespace: nsId( 'template' ),
			lhshow: 'redirect',
			lhlimit: '500'
		} );
		const aliasRequestRedirects = toRedirectsObject( aliasRequest.query.redirects );
		for ( const page of aliasRequest.query.pages ) {
			let cacheKey: SupportedAttributionNoticeType;

			// Find the key of this page in the list of attribution notice templates.
			// Slightly expensive, but this init should only be run once anyway.
			for ( const key in this.attributionNoticeTemplates ) {
				const templatePage = this.attributionNoticeTemplates[
					key as SupportedAttributionNoticeType
				].getPrefixedText();
				if (
					// Page is a perfect match.
					templatePage === page.title ||
					// If the page was moved, and the page originally listed above is a redirect.
					// This checks if the resolved redirect matches the input page.
					aliasRequestRedirects[ templatePage ] === page.title
				) {
					cacheKey = key as SupportedAttributionNoticeType;
					break;
				}
			}
			if ( !cacheKey ) {
				// Unexpected key not found. Page must have been moved or modified.
				// Give up here.
				continue;
			}

			const links = page.linkshere.map( ( v: { title: string } ) => new mw.Title( v.title ) );
			this.templateAliasCache[ cacheKey ].push( ...links );
		}

		// templateAliasKeymap setup
		this.templateAliasKeymap = {};
		for ( const noticeType in this.templateAliasCache ) {
			for ( const title of this.templateAliasCache[
				noticeType as SupportedAttributionNoticeType
			] ) {
				this.templateAliasKeymap[ title.getPrefixedDb() ] = noticeType as
					SupportedAttributionNoticeType;
			}
		}

		// templateAliasRegExp setup

		const summarizedTitles = [];
		for ( const titles of getObjectValues( this.templateAliasCache ) ) {
			summarizedTitles.push( titles );
		}
		this.templateAliasRegExp = new RegExp(
			summarizedTitles.map( ( v ) => `(${mw.util.escapeRegExp( v )})` ).join( '|' ),
			'g'
		);
	}

	/**
	 * Get the notice type of a given template from its href string, or `undefined` if it
	 * is not a valid notice.
	 *
	 * @param href The href of the template.
	 * @return A notice type string.
	 */
	static getTemplateNoticeType( href: string ): SupportedAttributionNoticeType {
		return this.templateAliasKeymap[ href.replace( /^\.\//, '' ) ];
	}

}
