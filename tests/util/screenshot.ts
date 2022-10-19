import * as path from 'path';
import * as fs from 'fs/promises';
import { ScreenshotOptions } from 'puppeteer';

/**
 *
 * @param name
 * @param options
 */
export default async function screenshot(
	name: string,
	options: ScreenshotOptions = {}
): Promise<void> {
	const image = await page.screenshot( Object.assign( options, { encoding: 'binary' } ) );
	const prefix = process.env.GITHUB_RUN_ID ??
		new Date().toISOString().replace( /:/g, '.' );
	await fs.mkdir(
		path.join( __dirname, '..', 'artifacts' ),
		{ recursive: true }
	);
	await fs.writeFile(
		path.join( __dirname, '..', 'artifacts', `${prefix}--${name}.png` ),
		image
	);
}
