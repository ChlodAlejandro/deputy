const fs = require( 'fs' );
const path = require( 'path' );

const version = process.env.npm_package_version ?
	process.env.npm_package_version :
	require( path.join( __dirname, '/../package.json' ) ).version;

const versionFile = path.join( __dirname, '/../src/DeputyVersion.ts' );
const versionFileText = fs.readFileSync( versionFile ).toString();
const deputyVersionRegex = /\/\* v \*\/'.+?'\/\* v \*\//;

fs.writeFileSync( versionFile, versionFileText.replace(
	deputyVersionRegex,
	`/* v */'${version}'/* v */`
) );
