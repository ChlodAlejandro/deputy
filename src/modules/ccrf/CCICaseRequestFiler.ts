import DeputyModule from '../DeputyModule';
import deputyCcrfEnglish from '../../../i18n/ccrf/en.json';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iaStyles from './css/cci-case-request-filer.css';
import DeputyLanguage from '../../DeputyLanguage';
import deputySharedEnglish from '../../../i18n/shared/en.json';
import CaseRequestFilingDialog from './ui/CaseRequestFilingDialog';
import { getEntrypointButton } from './getEntrypointButton';
import findSectionHeading from '../../wiki/util/findSectionHeading';
import unwrapWidget from '../../util/unwrapWidget';
import last from '../../util/last';
import getSectionElements from '../../wiki/util/getSectionElements';
import equalTitle from '../../util/equalTitle';
import normalizeTitle from '../../wiki/util/normalizeTitle';
import classMix from '../../util/classMix';

declare global {
	interface Window {
		CCICaseRequestFiler?: CCICaseRequestFiler;
		ccrfEntrypoint?: any;
	}
}

/**
 *
 */
export default class CCICaseRequestFiler extends DeputyModule {

	static readonly dependencies = [
		'oojs-ui-core',
		'oojs-ui-widgets',
		'oojs-ui-windows',
		'oojs-ui.styles.icons-movement',
		'oojs-ui.styles.icons-interactions',
		'mediawiki.util',
		'mediawiki.api',
		'mediawiki.Title',
		'mediawiki.widgets',
		'mediawiki.widgets.UserInputWidget'
	];

	readonly static = CCICaseRequestFiler;

	dialog: any;

	/**
	 * @inheritDoc
	 */
	getName(): string {
		return 'ccrf';
	}

	/**
	 * @inheritDoc
	 */
	getModuleKey(): string {
		return 'cci';
	}

	/**
	 * Perform actions that run *before* IA starts (prior to execution). This involves
	 * adding in necessary UI elements that serve as an entry point to IA.
	 */
	async preInit(): Promise<boolean> {
		if ( !await super.preInit( deputyCcrfEnglish ) ) {
			return false;
		}

		if ( this.wikiConfig.cci.rootPage.get() == null ) {
			// Root page is invalid. Don't run.
			return false;
		}

		await DeputyLanguage.load( 'shared', deputySharedEnglish );

		mw.hook( 'ccrf.preload' ).fire();
		mw.util.addCSS( iaStyles );

		mw.hook( 'ccrf.postload' ).fire();

		if ( !window.ccrfEntrypoint ) {
			// No entrypoint buttons yet.
			const entrypointButton = await getEntrypointButton();
			const placeholder = document.querySelector(
				'.mw-body-content .mw-parser-output .ccrf-placeholder'
			);
			if ( placeholder ) {
				placeholder.replaceChildren( unwrapWidget( entrypointButton ) );
			} else {
				this.getWikiConfig().then( ( config ) => {
					if ( !equalTitle( config.cci.rootPage.get(), normalizeTitle() ) ) {
						// Not the right page.
						return;
					}

					const requestsHeader = findSectionHeading( config.cci.requestsHeader.get() );

					last( getSectionElements( requestsHeader ) ).insertAdjacentElement(
						'afterend', unwrapWidget( entrypointButton )
					);
				} );
			}
		}

		return true;
	}

	/**
	 *
	 */
	async openWorkflowDialog(): Promise<void> {
		window.ccrfEntrypoint.setDisabled( true );
		return mw.loader.using( CCICaseRequestFiler.dependencies, async () => {
			if ( !this.dialog ) {
				// The following classes are used here:
				// * deputy
				// * cci-case-request-filer
				this.dialog = CaseRequestFilingDialog( {
					classes: classMix(
						// Attach "deputy" class if Deputy.
						this.deputy ? 'deputy' : null,
						'cci-case-request-filer'
					).split( ' ' )
				} );
				this.windowManager.addWindows( [ this.dialog ] );
			}
			await this.windowManager.openWindow( this.dialog ).opened;
		} );
	}

}
