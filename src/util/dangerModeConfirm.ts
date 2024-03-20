import UserConfiguration from '../config/UserConfiguration';

/**
 * Shows a confirmation dialog, if the user does not have danger mode enabled.
 * If the user has danger mode enabled, this immediately resolves to true, letting
 * the action run immediately.
 *
 * Do not use this with any action that can potentially break templates, user data,
 * or cause irreversible data loss.
 *
 * @param config The user's configuration
 * @param message See {@link OO.ui.MessageDialog}'s parameters.
 * @param options See {@link OO.ui.MessageDialog}'s parameters.
 * @return Promise resolving to a true/false boolean.
 */
export default function dangerModeConfirm(
	config: UserConfiguration,
	message: JQuery | string,
	options?: OO.ui.MessageDialog.SetupDataMap
): JQuery.Promise<boolean> {
	if ( config.all.core.dangerMode.get() ) {
		return $.Deferred().resolve( true );
	} else {
		return OO.ui.confirm( message, options );
	}
}
