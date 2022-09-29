import normalizeTitle, { TitleLike } from './normalizeTitle';
import MwApi from '../../MwApi';

/**
 * Purges a page.
 *
 * @param title The title of the page to purge
 */
export default async function purge( title: TitleLike ): Promise<void> {
	await MwApi.action.post( {
		action: 'purge',
		titles: normalizeTitle( title ).getPrefixedText(),
		redirects: true
	} );
}
