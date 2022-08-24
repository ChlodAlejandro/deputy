import typescript from 'rollup-plugin-typescript2';
import sourcemaps from 'rollup-plugin-sourcemaps';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import license from 'rollup-plugin-node-license';
import { createFilter } from 'rollup-pluginutils';
import * as fs from 'fs';
import * as path from 'path';

const production = process.env.NODE_ENV === 'production';

// UTILS

/**
 * Converts standard text to block comments.
 *
 * @param text The text to block comment-ify.
 * @return {string} Block comment-ified text.
 */
function blockCommentIfy( text ) {
	let final = '';
	const lines = text.toString().split( '\n' );
	for ( const lineNo in lines ) {
		const line = lines[ lineNo ];

		if ( +lineNo === 0 ) {
			final += `/*!\n * ${line}\n`;
		} else if ( +lineNo === lines.length - 1 ) {
			final += ` * ${line}\n */`;
		} else {
			final += ` * ${line}\n`;
		}
	}
	return final;
}

/**
 * Loads a banner file.
 *
 * @param {string} bannerPath Path parts to the banner file
 * @return {string} A fully-decorated banner
 */
function loadBanner( ...bannerPath ) {
	return blockCommentIfy( fs.readFileSync( path.join( __dirname, ...bannerPath ) ) );
}

// TRANSFORMS

/**
 * Loads CSS files as strings. Facilitates CSS loading through `mw.util`.
 *
 * @param {Object} options Options for the plugin.
 * @param {boolean} options.minify Whether to perform a simple CSS minify.
 * @return The plugin
 */
function cssString( options = { minify: true } ) {
	const filter = createFilter( 'src/**/*.css' );

	return {
		name: 'CSS as string',
		transform( code, id ) {
			if ( filter( id ) ) {
				return {
					code: `export default ${JSON.stringify(
						options.minify ? code.replace( /[\n\t]/g, '' ) : code
					)};`,
					map: { mappings: '' }
				};
			}
		}
	};
}

// OPTIONS

/**
 * Get plugins for this Rollup instance.
 *
 * @return {Plugin[]}
 */
function getPlugins() {
	return [
		// Appends license information
		license(),
		// Inserts sourcemaps
		!production && sourcemaps(),
		// Makes Common.js imports possible
		commonjs(),
		// Handles Node-like resolution
		nodeResolve( { browser: false } ),
		// Transpiles TypeScript
		typescript(),
		// Allows JSON imports (i18n files)
		json(),
		// Transform CSS to standard JS strings
		cssString()
	].filter( ( v ) => !!v );
}

/**
 * Automatically disable a given component based on environment variables.
 *
 * Setting the `DEPUTY_ONLY` environment variable will allow only projects with the
 * assigned key to be built. Setting the `DEPUTY_NO` environment variable will disallow
 * all projects with the assigned key from being built.
 *
 * @param {string} key
 * @param {import('rollup').RollupOptions} options
 * @return {import('rollup').RollupOptions} Options if enabled, `false`, if otherwise.
 */
function auto( key, options ) {
	if ( process.env.DEPUTY_ONLY ) {
		// Filter out not included.
		return process.env.DEPUTY_ONLY.split( ',' ).indexOf( key ) !== -1 && options;
	} else if ( process.env.DEPUTY_NO ) {
		// Filter out disabled.
		return process.env.DEPUTY_NO.split( ',' ).indexOf( key ) === -1 && options;
	} else {
		// Always enable.
		return options;
	}
}

/**
 * @type {import('rollup').RollupOptions[]}
 */
export default [
	// Deputy core
	auto( 'deputy', {
		input: 'src/Deputy.ts',
		output: {
			sourcemap: true,
			file: 'build/deputy.js',
			format: 'iife',
			banner: loadBanner( 'BANNER.txt' ) +
				'\n// <nowiki>',
			footer: '// </nowiki>\n// <3'
		},
		plugins: getPlugins()
	} ),
	// Standalone Attribution Notice Template Editor
	auto( 'ante', {
		input: 'src/modules/ante/CopiedTemplateEditorStandalone.ts',
		output: {
			sourcemap: true,
			file: 'build/deputy-ante.js',
			format: 'iife',
			banner: loadBanner( 'src', 'modules', 'ante', 'BANNER.txt' ) +
				'\n// <nowiki>',
			footer: '// </nowiki>\n// <3'
		},
		plugins: getPlugins()
	} ),
	// Standalone Infringement Assistant
	auto( 'ia', {
		input: 'src/modules/ia/InfringementAssistantStandalone.ts',
		output: {
			sourcemap: true,
			file: 'build/deputy-ia.js',
			format: 'iife',
			banner: loadBanner( 'src', 'modules', 'ia', 'BANNER.txt' ) +
				'\n// <nowiki>',
			footer: '// </nowiki>\n// <3'
		},
		plugins: getPlugins()
	} )
].filter( ( v ) => !!v );
