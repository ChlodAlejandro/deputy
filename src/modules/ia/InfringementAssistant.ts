import DeputyModule from '../DeputyModule';
import deputyIaEnglish from '../../../i18n/ia/en.json';

/**
 *
 */
export default class InfringementAssistant extends DeputyModule {

	/**
	 * @inheritDoc
	 */
	getName(): string {
		return 'ia';
	}

	/**
	 * Perform actions that run *before* CTE starts (prior to execution). This involves
	 * adding in necessary UI elements that serve as an entry point to CTE.
	 */
	async preInit(): Promise<void> {
		await super.preInit( deputyIaEnglish );
	}

}
