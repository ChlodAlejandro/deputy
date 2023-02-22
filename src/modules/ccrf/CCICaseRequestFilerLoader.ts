import getPageExists from '../../wiki/util/getPageExists';
import WikiConfigurationLocations from '../../config/WikiConfigurationLocations';
import getPageContent from '../../wiki/util/getPageContent';
import { appendEntrypointButtons } from './AppendEntrypointButtons';
import findSectionHeading from '../../wiki/util/findSectionHeading';

/**
 * This function loads in the standalone version of the CCI Case Request Filer.
 *
 * The loader is meant to be lightweight to allow little to no delays in loading.
 * When ready for use, the core module will be loaded with `appendEntrypointButtons`.
 */
( async () => {
	const configLocations = await getPageExists( WikiConfigurationLocations );
	if ( configLocations.length > 0 ) {
		const config = JSON.parse( await getPageContent( configLocations[ 0 ] ) );
		if (
			config &&
			config.cci &&
			config.cci.rootPage &&
			config.cci.requestsHeader &&
			config.cci.requestsTemplate
		) {
			const requestsHeader = findSectionHeading( config.cci.requestsHeader );
			appendEntrypointButtons( requestsHeader );
		}
	}
} )();
