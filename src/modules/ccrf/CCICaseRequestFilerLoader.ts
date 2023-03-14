import getPageExists from '../../wiki/util/getPageExists';
import WikiConfigurationLocations from '../../config/WikiConfigurationLocations';
import getPageContent from '../../wiki/util/getPageContent';
import { getEntrypointButton } from './getEntrypointButton';
import findSectionHeading from '../../wiki/util/findSectionHeading';
import DeputyLanguage from '../../DeputyLanguage';
import deputySharedEnglish from '../../../i18n/shared/en.json';
import deputyCcrfLoaderEnglish from '../../../i18n/ccrf-loader/en.json';
import unwrapWidget from '../../util/unwrapWidget';
import last from '../../util/last';
import getSectionElements from '../../wiki/util/getSectionElements';
import equalTitle from '../../util/equalTitle';
import normalizeTitle from '../../wiki/util/normalizeTitle';
import applyOverrides from '../../util/applyOverrides';

/**
 * This function loads in the standalone version of the CCI Case Request Filer.
 *
 * The loader is meant to be lightweight to allow little to no delays in loading.
 * When ready for use, the core module will be loaded with `appendEntrypointButtons`.
 */
( async () => {
	await DeputyLanguage.load( 'shared', deputySharedEnglish );
	await DeputyLanguage.load( 'ccrf-loader', deputyCcrfLoaderEnglish );

	mw.hook( 'ccrf.loader.preload' ).fire();

	const entrypointButton = await getEntrypointButton();
	const placeholder = document.querySelector(
		'.mw-body-content .mw-parser-output .ccrf-placeholder'
	);
	if ( placeholder ) {
		placeholder.replaceChildren( unwrapWidget( entrypointButton ) );
	} else {
		const configLocations = await getPageExists( WikiConfigurationLocations );
		if ( configLocations.length > 0 ) {
			const configContent = await getPageContent( configLocations[ 0 ] );
			let config;
			try {
				config = JSON.parse( configContent );
			} catch ( e ) {
				return mw.notify( mw.msg( 'deputy.loadError.wikiConfig' ) );
			}
			// #if _DEV
			if ( window.deputyWikiConfigOverride ) {
				console.warn(
					'Configuration overrides found for Deputy. This may be bad!'
				);
				applyOverrides(
					config,
					window.deputyWikiConfigOverride,
					( key, oldVal, newVal ) => {
						console.warn( `${key}: ${
							JSON.stringify( oldVal )
						} → ${
							JSON.stringify( newVal )
						}` );
					}
				);
			}
			// #endif
			if (
				config &&
				config.cci &&
				config.cci.rootPage &&
				config.cci.requestsHeader &&
				config.cci.requestsTemplate &&
				equalTitle( config.cci.rootPage, normalizeTitle() )
			) {
				const requestsHeader = findSectionHeading( config.cci.requestsHeader );

				last( getSectionElements( requestsHeader ) ).insertAdjacentElement(
					'afterend', unwrapWidget( entrypointButton )
				);
			}
		}
	}

	mw.hook( 'ccrf.loader.postload' ).fire();
} )();
