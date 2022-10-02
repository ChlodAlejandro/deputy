const path = require( 'path' );
const chokidar = require( 'chokidar' );
const chalk = require( 'chalk' );
const serve = require( 'serve-handler' );
const http = require( 'http' );
const DeputyBuilder = require( './builder.js' );

const rootDirectory = path.resolve( __dirname, '..' );
const buildDirectory = path.resolve( rootDirectory, 'build' );
const sourceDirectory = path.resolve( rootDirectory, 'src' );

let rebuildsPaused = false;
const builder = new DeputyBuilder();

// Start!

( async function () {
	console.log( chalk.gray( 'Hotkeys: [r]ebuild, [p]ause, [q]uit' ) );
	console.log( chalk.blue( 'Building for the first time...' ) );
	await builder.build();

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
		builder.build().then( function () {
			console.log( chalk.green( 'Rebuild complete.' ) );
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
