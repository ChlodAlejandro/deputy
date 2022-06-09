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

/**
 * Rebuild everything with Babel.
 */
async function rebuild() {
	if ( fs.existsSync( buildDirectory ) ) {
		fs.rmSync( buildDirectory, { recursive: true } );
	}

	const child = childProcess.spawn(
		which.sync( 'npm' ),
		[
			'run', 'build'
		],
		{
			cwd: rootDirectory
		}
	);

	child.stdout.on( 'data', ( d ) => {
		d.toString().trim().split( '\n' ).forEach( ( line ) => {
			console.log( chalk.yellow( '[build] ' ) + line );
		} );
	} );

	child.stderr.on( 'data', ( d ) => {
		d.toString().trim().split( '\n' ).forEach( ( line ) => {
			console.error( chalk.yellow( '[build] ' ) + line );
		} );
	} );

	child.on( 'error', ( err ) => {
		console.log( chalk.yellow( '[babel] ' ) + chalk.red( err.toString() ) );
	} );

	await new Promise( ( res ) => {
		child.on( 'exit', ( code ) => {
			if ( code !== 0 ) {
				console.log( chalk.red( `Build script exited with code ${code}` ) );
			}
			res();
		} );
	} );
}

// Start!

( async function () {
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

	watcher.on( 'change', function () {
		console.log( chalk.blue( 'Rebuilding...' ) );
		if ( rebuild.active ) {
			return;
		}
		rebuild.active = true;
		rebuild().then( function () {
			console.log( chalk.green( 'Rebuild complete.' ) );
			rebuild.active = false;
		} );
	} );
}() );