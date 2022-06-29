import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { string } from 'rollup-plugin-string';
import license from 'rollup-plugin-node-license';
import * as fs from 'fs';
import * as path from 'path';

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

export default {
	input: 'src/Deputy.ts',
	output: {
		dir: 'build',
		format: 'iife',
		banner: blockCommentIfy( fs.readFileSync( path.join( __dirname, 'BANNER.txt' ) ) )
	},
	plugins: [
		nodeResolve( { browser: true } ),
		string( { include: 'src/css/*.css' } ),
		json(),
		typescript(),
		license()
	]
};
