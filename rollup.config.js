import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import license from 'rollup-plugin-node-license';
import * as fs from 'fs';
import * as path from 'path';

export default {
	input: 'src/deputy.core.ts',
	output: {
		dir: 'build',
		format: 'iife',
		banner: fs.readFileSync( path.join( __dirname, 'BANNER.txt' ) )
	},
	plugins: [ typescript(), nodeResolve( {
		browser: true
	} ), license() ]
};
