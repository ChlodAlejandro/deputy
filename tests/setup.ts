import childProcess from 'child_process';
import * as path from 'path';

childProcess.execSync( 'npm run build', {
	cwd: path.resolve( __dirname, '..' )
} );
