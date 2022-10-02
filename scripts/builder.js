const fs = require( 'fs' );
const childProcess = require( 'child_process' );
const which = require( 'which' );
const chalk = require( 'chalk' );
const path = require( 'path' );

const rootDirectory = path.resolve( __dirname, '..' );
const buildDirectory = path.resolve( rootDirectory, 'build' );

module.exports = class DeputyBuilder {

	/**
	 * Build everything with Rollup.
	 *
	 * @return Promise<void>
	 */
	async build() {
		/**
		 * `true` when currently building.
		 *
		 * @type {boolean}
		 */
		this.building = true;

		if ( this.buildProcess && this.buildProcess.exitCode == null ) {
			this.buildProcess.kill( 'SIGKILL' );
		}

		// Cleanup
		if ( fs.existsSync( buildDirectory ) ) {
			fs.rmSync( buildDirectory, { recursive: true } );
		}

		/**
		 * @type {childProcess.ChildProcessWithoutNullStreams}
		 */
		this.buildProcess = childProcess.spawn(
			which.sync( 'npm' ),
			[
				'run', 'build'
			],
			{
				cwd: rootDirectory,
				env: process.env
			}
		);

		this.buildProcess.stdout.on( 'data', ( d ) => {
			d.toString().trim().split( '\n' ).forEach( ( line ) => {
				console.log( chalk.yellow( '[build] ' ) + line );
			} );
		} );

		this.buildProcess.stderr.on( 'data', ( d ) => {
			d.toString().trim().split( '\n' ).forEach( ( line ) => {
				console.error( chalk.yellow( '[build] ' ) + line );
			} );
		} );

		this.buildProcess.on( 'error', ( err ) => {
			console.log( chalk.yellow( '[build] ' ) + chalk.red( err.toString() ) );
		} );

		return new Promise( ( res, rej ) => {
			this.buildProcess.on( 'exit', ( code ) => {
				if ( code !== 0 ) {
					console.log( chalk.red( `Build script exited with code ${code}` ) );
					rej( code );
				} else {
					res();
				}
			} );
		} ).finally( () => {
			this.building = false;
		} );
	}

};
