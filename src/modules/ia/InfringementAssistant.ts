import DeputyModule from '../DeputyModule';
import deputyIaEnglish from '../../../i18n/ia/en.json';
import CopyrightProblemsPage from './models/CopyrightProblemsPage';
import CopyrightProblemsSession from './models/CopyrightProblemsSession';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iaStyles from './css/infringement-assistant.css';
import DeputyLanguage from '../../DeputyLanguage';
import deputySharedEnglish from '../../../i18n/shared/en.json';
import SinglePageWorkflowDialog from './ui/SinglePageWorkflowDialog';

declare global {
	interface Window {
		InfringementAssistant?: InfringementAssistant;
	}
}

/**
 *
 */
export default class InfringementAssistant extends DeputyModule {

	static readonly dependencies = [
		'moment',
		'oojs-ui-core',
		'oojs-ui-widgets',
		'oojs-ui-windows',
		'mediawiki.util',
		'mediawiki.api',
		'mediawiki.Title'
	];

	readonly static = InfringementAssistant;
	readonly CopyrightProblemsPage = CopyrightProblemsPage;
	readonly SinglePageWorkflowDialog = SinglePageWorkflowDialog;

	session: CopyrightProblemsSession;
	dialog: any;

	/**
	 * @inheritDoc
	 */
	getName(): string {
		return 'ia';
	}

	/**
	 * Perform actions that run *before* IA starts (prior to execution). This involves
	 * adding in necessary UI elements that serve as an entry point to IA.
	 */
	async preInit(): Promise<boolean> {
		if ( !await super.preInit( deputyIaEnglish ) ) {
			return false;
		}

		if ( this.wikiConfig.ia.rootPage.get() == null ) {
			// Root page is invalid. Don't run.
			return false;
		}

		await Promise.all( [
			DeputyLanguage.load( 'shared', deputySharedEnglish ),
			DeputyLanguage.loadMomentLocale()
		] );
		const config = await this.getWikiConfig();
		CopyrightProblemsPage.rootPage = config.ia.rootPage.get();

		mw.hook( 'infringementAssistant.preload' ).fire();
		mw.util.addCSS( iaStyles );

		if (
			// Button not yet appended
			document.getElementById( 'pt-ia' ) == null &&
			// Not virtual namespace
			mw.config.get( 'wgNamespaceNumber' ) >= 0
		) {
			mw.util.addPortletLink(
				'p-tb',
				'#',
				// Messages used here:
				// * deputy.ia
				// * deputy.ia.short
				// * deputy.ia.acronym
				mw.msg( {
					full: 'deputy.ia',
					short: 'deputy.ia.short',
					acronym: 'deputy.ia.acronym'
				}[ this.config.core.portletNames.get() ] ),
				'pt-ia'
			).addEventListener( 'click', ( event ) => {
				event.preventDefault();
				if (
					!( event.currentTarget as HTMLElement )
						.hasAttribute( 'disabled' )
				) {
					this.openWorkflowDialog();
				}
			} );
		}

		// Autostart

		// Query parameter-based autostart disable (i.e. don't start if param exists)
		if ( !/[?&]ia-autostart(=(0|no|false|off)?(&|$)|$)/.test( window.location.search ) ) {
			await this.init();
		}
		return true;
	}

	/**
	 *
	 */
	async init(): Promise<void> {
		if (
			CopyrightProblemsPage.isListingPage() &&
			[ 'view', 'diff' ].indexOf( mw.config.get( 'wgAction' ) ) !== -1
		) {
			this.session = new CopyrightProblemsSession();
			mw.hook( 'wikipage.content' ).add( () => {
				this.session.getListings().forEach( ( listing ) => {
					this.session.addListingActionLink( listing );
				} );
			} );
		}
	}

	/**
	 *
	 */
	async openWorkflowDialog(): Promise<void> {
		return mw.loader.using( InfringementAssistant.dependencies, async () => {
			if ( !this.dialog ) {
				this.dialog = SinglePageWorkflowDialog( {
					page: new mw.Title( mw.config.get( 'wgPageName' ) ),
					revid: mw.config.get( 'wgCurRevisionId' )
				} );
				this.windowManager.addWindows( [ this.dialog ] );
			}
			this.windowManager.openWindow( this.dialog );
		} );
	}

}
