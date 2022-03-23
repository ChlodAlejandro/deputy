const path = require( 'path' );
const httpServer = require( 'http-server' );
const childProcess = require( 'child_process' );
const fs = require( 'fs' );
const chokidar = require( 'chokidar' );
const chalk = require( 'chalk' );

const rootDirectory = path.resolve( __dirname, '..' );
const babelBin = path.resolve( rootDirectory, 'node_modules', '.bin',
	process.platform.startsWith( 'win' ) ? 'babel.cmd' : 'babel'
);
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
		babelBin,
		[
			sourceDirectory,
			'--out-dir', buildDirectory,
			'--extensions', '.ts'
		],
		{
			cwd: rootDirectory
		}
	);

	child.stdout.on( 'data', ( d ) => {
		console.log( chalk.yellow( '[babel] ' ) + d.toString().trim() );
	} );

	child.stderr.on( 'data', ( d ) => {
		console.log( chalk.yellow( '[babel] ' ) + chalk.red( d.toString().trim() ) );
	} );

	child.on( 'error', ( err ) => {
		console.log( chalk.yellow( '[babel] ' ) + chalk.red( err.toString() ) );
	} );

	await new Promise( ( res ) => {
		child.on( 'exit', ( code ) => {
			if ( code !== 0 ) {
				console.log( chalk.red( `Babel exited with code ${code}` ) );
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
	// http-server src/ -p 45000 -d -i -c-1 --cors --no-dotfiles
	const server = httpServer.createServer( {
		root: buildDirectory,
		cache: -1,
		showDir: true,
		showDotfiles: false,
		cors: true
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
		rebuild().then( function () {
			console.log( chalk.green( 'Rebuild complete.' ) );
		} );
	} );
}() );
