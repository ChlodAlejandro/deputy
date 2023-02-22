import DeputyModule from '../DeputyModule';
import deputyIaEnglish from '../../../i18n/ia/en.json';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iaStyles from './css/cci-case-request-filer.css';
import DeputyLanguage from '../../DeputyLanguage';
import deputySharedEnglish from '../../../i18n/shared/en.json';
import CaseRequestFilingDialog from './ui/CaseRequestFilingDialog';
import { appendEntrypointButtons } from './AppendEntrypointButtons';
import findSectionHeading from '../../wiki/util/findSectionHeading';

declare global {
	interface Window {
		CCICaseRequestFiler?: CCICaseRequestFiler;
		ccrfEntrypoint: any;
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
		'mediawiki.util',
		'mediawiki.api',
		'mediawiki.Title',
		'mediawiki.widgets'
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
	 * Perform actions that run *before* IA starts (prior to execution). This involves
	 * adding in necessary UI elements that serve as an entry point to IA.
	 */
	async preInit(): Promise<boolean> {
		if ( !await super.preInit( deputyIaEnglish ) ) {
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

		if ( document.querySelector( '.deputy-ccrf-entrypoint' ) == null ) {
			// No entrypoint buttons yet.
			this.getWikiConfig().then( ( config ) => {
				const requestsHeader = findSectionHeading( config.cci.requestsHeader.get() );
				appendEntrypointButtons( requestsHeader );
			} );
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
				this.dialog = CaseRequestFilingDialog();
				this.windowManager.addWindows( [ this.dialog ] );
			}
			await this.windowManager.openWindow( this.dialog );
		} );
	}

}
