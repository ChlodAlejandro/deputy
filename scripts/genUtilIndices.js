const fs = require( 'fs/promises' );
const path = require( 'path' );

/**
 * Generates `util` and `mw/util` indices.
 */
( async () => {

	/**
	 *
	 * @param subpath
	 */
	async function genIndex( subpath ) {
		const utilPath = path.join( process.cwd(), 'src', subpath );
		const modules = [];
		const hasNoDefault = [];

		const dir = ( await fs.opendir( utilPath ) );
		for await ( const fse of dir ) {
			const moduleName = fse.name.replace( /\.ts$/, '' );

			if ( fse.isFile() && fse.name !== 'index.ts' ) {
				modules.push( moduleName );
				if (
					!( await fs.readFile( path.join( utilPath, fse.name ) ) )
						.toString( 'utf8' )
						.includes( 'export default' )
				) {
					hasNoDefault.push( moduleName );
				}
			}
		}

		await fs.writeFile(
			path.join( utilPath, 'index.ts' ),
			modules
				.map( v => `import ${
					hasNoDefault.includes( v ) ? `* as ${v}` : v
				} from './${v}';` )
				.join( '\n' ) +
			'\n' +
			'export default {\n' +
			modules
				.map( ( v, i ) => `\t${v}: ${v}` + ( i === modules.length - 1 ? '' : ',' ) )
				.join( '\n' ) + '\n' +
			'};\n'
		);
	}

	try {
		await genIndex( 'util' );
	} catch ( e ) {
		console.error( 'Failed to generate indices for src/util.', e );
	}

	try {
		await genIndex( 'wiki/util' );
	} catch ( e ) {
		console.error( 'Failed to generate indices for src/wiki/util.', e );
	}

} )();
