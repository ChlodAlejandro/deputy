import DeputyLanguage from '../../DeputyLanguage';
import deputyArchivistEnglish from '../../../i18n/archivist/en.json';
import DeputyModule from '../DeputyModule';

/**
 * Main class for Archivist.
 */
export default class Archivist extends DeputyModule {

	/**
	 * @inheritDoc
	 */
	getName(): string {
		return 'archivist';
	}

	/**
	 * Perform actions that run *before* Archivist starts (prior to execution). This involves
	 * adding in necessary UI elements that serve as an entry point to Archivist.
	 */
	async preInit(): Promise<void> {
		await DeputyLanguage.load( 'archivist', deputyArchivistEnglish );

		if (
			// Button not yet appended
			document.getElementById( 'pt-archivist' ) == null &&
			// Not virtual namespace
			mw.config.get( 'wgNamespaceNumber' ) >= 0
		) {
			mw.util.addPortletLink(
				'p-tb',
				'#',
				mw.message( 'deputy.archivist' ).text(),
				'pt-archivist'
			).addEventListener( 'click', ( event ) => {
				event.preventDefault();
				if (
					!( event.currentTarget as HTMLElement )
						.hasAttribute( 'disabled' )
				) {
					this.toggleButtons( false );
					this.openEditDialog();
				}
			} );
		}
	}

}
