import WikiConfiguration from './WikiConfiguration';

/**
 * Automatically applies a change tag to edits made by the user if
 * a change tag was provided in the configuration.
 *
 * @param config
 * @return A spreadable Object containing the `tags` parameter for `action=edit`.
 */
export default function changeTag( config: WikiConfiguration ): { tags?: string } {
	return config.core.changeTag.get() ?
		{ tags: config.core.changeTag.get() } :
		{};
}
