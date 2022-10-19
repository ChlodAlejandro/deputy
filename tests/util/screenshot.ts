import * as path from 'path';
import * as fs from 'fs';

/**
 *
 * @param name
 */
export default async function screenshot( name?: string ): Promise<void> {
	const image = await page.screenshot( { encoding: 'binary' } );
	const prefix = process.env.GITHUB_RUN_ID ??
		new Date().toISOString().replace( /:/g, '.' );
	fs.writeFileSync(
		path.join( __dirname, '..', 'artifacts', `${prefix}--${name}.png` ),
		image
	);
}
