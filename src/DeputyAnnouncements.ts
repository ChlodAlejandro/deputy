import DeputyLanguage from './DeputyLanguage';
import deputyAnnouncementsEnglish from '../i18n/announcements/en.json';
import deputySharedEnglish from '../i18n/shared/en.json';
import UserConfiguration from './config/UserConfiguration';
import DeputyMessageWidget from './ui/shared/DeputyMessageWidget';
import unwrapWidget from './util/unwrapWidget';

/**
 * An announcement. The "Dismiss" option will always be pre-added.
 *
 * Title, description, and action labels are automatically loaded from
 * `i18n/announcements/<lang>.json`. Ensure that the relevant message
 * keys are available.
 */
interface Announcement {
	expiry?: Date;
	actions: { id: string, flags?: string[], action: () => void }[];
}

/**
 *
 * Deputy announcements
 *
 * This will be loaded on all standalone modules and on main Deputy.
 * Be conservative with what you load!
 *
 */
export default class DeputyAnnouncements {

	static knownAnnouncements: Record<string, Announcement> = {
		// No active announcements

		// 'announcementId': {
		// 	actions: [
		// 		{
		// 			id: 'actionButton',
		// 			flags: [ 'primary', 'progressive' ],
		// 			action: () => { /* do something */ }
		// 		}
		// 	]
		// }
	};

	/**
	 * Initialize announcements.
	 * @param config
	 */
	static async init( config: UserConfiguration ) {
		await Promise.all( [
			DeputyLanguage.load( 'shared', deputySharedEnglish ),
			DeputyLanguage.load( 'announcements', deputyAnnouncementsEnglish )
		] );
		mw.util.addCSS( '#siteNotice .deputy { text-align: left; }' );
		for ( const [ id, announcements ] of Object.entries( this.knownAnnouncements ) ) {
			if ( config.core.seenAnnouncements.get().includes( id ) ) {
				continue;
			}
			if ( announcements.expiry && ( announcements.expiry < new Date() ) ) {
				// Announcement has expired. Skip it.
				continue;
			}

			this.showAnnouncement( config, id, announcements );
		}
	}

	/**
	 *
	 * @param config
	 * @param announcementId
	 * @param announcement
	 */
	static showAnnouncement(
		config: UserConfiguration,
		announcementId: string,
		announcement: Announcement
	) {
		mw.loader.using( [
			'oojs-ui-core',
			'oojs-ui.styles.icons-interactions'
		], () => {
			const messageWidget = DeputyMessageWidget( {
				classes: [ 'deputy' ],
				icon: 'feedback',
				// Messages that can be used here:
				// * deputy.announcement.<id>.title
				title: mw.msg( `deputy.announcement.${announcementId}.title` ),
				// Messages that can be used here:
				// * deputy.announcement.<id>.message
				message: mw.msg( `deputy.announcement.${announcementId}.message` ),
				closable: true,
				actions: announcement.actions.map( action => {
					const button = new OO.ui.ButtonWidget( {
						// Messages that can be used here:
						// * deputy.announcement.<id>.<action id>.message
						label: mw.msg(
							`deputy.announcement.${announcementId}.${action.id}.label`
						),
						// Messages that can be used here:
						// * deputy.announcement.<id>.<action id>.title
						title: mw.msg(
							`deputy.announcement.${announcementId}.${action.id}.title`
						),
						flags: action.flags ?? []
					} );
					button.on( 'click', action.action );
					return button;
				} )
			} );
			messageWidget.on( 'close', () => {
				config.core.seenAnnouncements.set(
					[ ...config.core.seenAnnouncements.get(), announcementId ]
				);
				config.save();
			} );
			document.getElementById( 'siteNotice' ).appendChild(
				unwrapWidget( messageWidget )
			);
		} );
	}

}
