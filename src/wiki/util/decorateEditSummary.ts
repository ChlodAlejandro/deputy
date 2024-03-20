import deputyVersion from '../../DeputyVersion';
import UserConfiguration from '../../config/UserConfiguration';

/**
 * Appends extra information to an edit summary (also known as the "advert").
 *
 * @param editSummary The edit summary
 * @param config The user's configuration. Used to get the "danger mode" setting.
 * @return The decorated edit summary (in wikitext)
 */
export default function ( editSummary: string, config?: UserConfiguration ): string {
	const dangerMode = config?.core.dangerMode.get() ?? false;
	return `${editSummary} ([[Wikipedia:Deputy|Deputy]] v${deputyVersion}${
		dangerMode ? '!' : ''
	})`;
}
