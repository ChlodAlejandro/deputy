import DeputyModule from '../DeputyModule';
import deputyIaEnglish from '../../../i18n/ia/en.json';
import CopyrightProblemsPage from './models/CopyrightProblemsPage';
import { CopyrightProblemsSession } from './models/CopyrightProblemsSession';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iaStyles from './css/infringement-assistant.css';

/**
 *
 */
export default class InfringementAssistant extends DeputyModule {

	readonly CopyrightProblemsPage = CopyrightProblemsPage;

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
			const session = new CopyrightProblemsSession();
			session.getListings().forEach( ( listing ) => {
				session.addListingActionLink( listing );
			} );
		}
	}

}
