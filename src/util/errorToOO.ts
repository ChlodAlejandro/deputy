import '../types';

/**
 * Converts a normal error into an OO.ui.Error for ProcessDialogs.
 *
 * @param error A plain error object.
 * @param config Error configuration.
 * @param config.recoverable Whether or not the error is recoverable.
 * @param config.warning Whether or not the error is a warning.
 * @return An OOUI Error.
 */
export default function errorToOO(
	error: Error,
	config: { recoverable: boolean, warning: boolean }
) {
	return new OO.ui.Error( error.message, config );
}
