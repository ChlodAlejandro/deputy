import DeputyModule from '../DeputyModule';
import deputyIaEnglish from '../../../i18n/ia/en.json';
import CopyrightProblemsPage from './models/CopyrightProblemsPage';
import CopyrightProblemsSession from './models/CopyrightProblemsSession';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iaStyles from './css/infringement-assistant.css';
import DeputyLanguage from '../../DeputyLanguage';
import deputySharedEnglish from '../../../i18n/shared/en.json';

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
		'oojs-ui-core',
		'oojs-ui-widgets',
		'mediawiki.util',
		'mediawiki.api',
		'mediawiki.Title'
	];

	readonly static = InfringementAssistant;
	readonly CopyrightProblemsPage = CopyrightProblemsPage;

	session: CopyrightProblemsSession;

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
	async preInit(): Promise<void> {
		await super.preInit( deputyIaEnglish );
		await DeputyLanguage.load( 'shared', deputySharedEnglish );

		mw.hook( 'infringementAssistant.preload' ).fire();

		// Autostart

		// Query parameter-based autostart disable (i.e. don't start if param exists)
		if ( !/[?&]ia-autostart(=(0|no|false|off)?(&|$)|$)/.test( window.location.search ) ) {
			await this.init();
		}
	}

	/**
	 *
	 */
	async init(): Promise<void> {
		if (
			CopyrightProblemsPage.isListingPage() &&
			[ 'view', 'diff' ].indexOf( mw.config.get( 'wgAction' ) ) !== -1
		) {
			mw.util.addCSS( iaStyles );
			this.session = new CopyrightProblemsSession();
			mw.hook( 'wikipage.content' ).add( () => {
				this.session.getListings().forEach( ( listing ) => {
					this.session.addListingActionLink( listing );
				} );
			} );
		}
	}

}
