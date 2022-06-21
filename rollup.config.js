import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { string } from 'rollup-plugin-string';
import license from 'rollup-plugin-node-license';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Converts standard text to block comments.
 *
 * @param string The text to block comment-ify.
 * @return {string} Block comment-ified text.
 */
function blockCommentIfy( string ) {
	let final = '';
	const lines = string.toString().split( '\n' );
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

export default {
	input: 'src/Deputy.ts',
	output: {
		dir: 'build',
		format: 'iife',
		banner: blockCommentIfy( fs.readFileSync( path.join( __dirname, 'BANNER.txt' ) ) )
	},
	plugins: [ string( {
		include: 'src/css/*.css'
	} ), typescript(), nodeResolve( {
		browser: true
	} ), license() ]
};
