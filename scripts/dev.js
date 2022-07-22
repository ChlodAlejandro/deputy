const path = require( 'path' );
const childProcess = require( 'child_process' );
const fs = require( 'fs' );
const chokidar = require( 'chokidar' );
const chalk = require( 'chalk' );
const which = require( 'which' );
const serve = require( 'serve-handler' );
const http = require( 'http' );

const rootDirectory = path.resolve( __dirname, '..' );
const buildDirectory = path.resolve( rootDirectory, 'build' );
const sourceDirectory = path.resolve( rootDirectory, 'src' );

let rebuildsPaused = false;

/**
 * @type {childProcess.ChildProcess}
 */
let buildProcess;
/**
 * Rebuild everything with Babel.
 */
async function rebuild() {
	if ( buildProcess && buildProcess.exitCode == null ) {
		buildProcess.kill( 'SIGKILL' );
	}

	if ( fs.existsSync( buildDirectory ) ) {
		fs.rmSync( buildDirectory, { recursive: true } );
	}

	buildProcess = childProcess.spawn(
		which.sync( 'npm' ),
		[
			'run', 'build'
		],
		{
			cwd: rootDirectory,
			env: process.env
		}
	);

	let sinceDone = null;

	buildProcess.stdout.on( 'data', ( d ) => {
		d.toString().trim().split( '\n' ).forEach( ( line ) => {
			if ( /^created .+? \d+?\.\ds/.test( line ) ) {
				sinceDone = Date.now();
			}
			console.log( chalk.yellow( '[build] ' ) + line );
		} );
	} );

	buildProcess.stderr.on( 'data', ( d ) => {
		d.toString().trim().split( '\n' ).forEach( ( line ) => {
			console.error( chalk.yellow( '[build] ' ) + line );
		} );
	} );

	buildProcess.on( 'error', ( err ) => {
		console.log( chalk.yellow( '[babel] ' ) + chalk.red( err.toString() ) );
	} );

	let interval;
	await new Promise( ( res ) => {
		buildProcess.on( 'exit', ( code ) => {
			if ( code !== 0 ) {
				console.log( chalk.red( `Build script exited with code ${code}` ) );
			}
			res();
		} );

		interval = setInterval( () => {
			if ( sinceDone != null && Date.now() - sinceDone > 2000 ) {
				buildProcess.kill( 'SIGKILL' );
				res();
			}
		}, 10 );
	} ).finally( () => {
		clearInterval( interval );
	} );
}

// Start!

( async function () {
	console.log( chalk.gray( 'Hotkeys: [r]ebuild, [p]ause, [q]uit' ) );
	console.log( chalk.blue( 'Building for the first time...' ) );
	await rebuild();

	console.log( chalk.blue( 'Starting development server...' ) );

	// Start development server.
	const server = http.createServer( ( request, response ) => {
		return serve( request, response, {
			public: buildDirectory,
			headers: [
				{
					source: '**',
					headers: [ {
						key: 'Access-Control-Allow-Origin',
						value: '*'
					} ]
				}
			]
		} );
	} );

	server.listen( process.env.PORT || 45000, () => {
		console.log( chalk.green( 'Development server started on port 45000.' ) );
	} );

	// Watch for changes to build directory.
	const watcher = chokidar.watch( sourceDirectory, {
		persistent: true
	} );

	/**
	 *
	 */
	function startRebuild() {
		if ( rebuildsPaused ) {
			return;
		}

		console.log( chalk.blue( 'Rebuilding...' ) );
		if ( rebuild.active ) {
			return;
		}
		rebuild.active = true;
		rebuild().then( function () {
			console.log( chalk.green( 'Rebuild complete.' ) );
			rebuild.active = false;
		} );
	}

	watcher.on( 'change', () => startRebuild() );

	process.stdin.setRawMode( true );
	process.stdin.resume();
	process.stdin.on( 'data',
		/**
		 * @param {Buffer} data
		 */
		function ( data ) {
			if ( data[ 0 ] === 114 ) {
				// R
				startRebuild();
			} else if ( data[ 0 ] === 112 ) {
				// P
				rebuildsPaused = !rebuildsPaused;
				console.log(
					chalk.yellowBright( `Rebuilds ${rebuildsPaused ? 'paused' : 'resumed'}` )
				);
			} else if ( data[ 0 ] === 113 ) {
				// Q
				process.exit();
			} else if ( data[ 0 ] === 3 ) {
				// Ctrl + C
				process.exit();
			}
		}
	);
}() );

process.on( 'uncaughtException', ( e ) => {
	console.error( e );
} );
process.on( 'unhandledRejection', ( e ) => {
	console.error( e );
} );
