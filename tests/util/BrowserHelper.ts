import webdriver from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import 'chromedriver';
import 'geckodriver';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Utility class for handling a browser environment during tests.
 */
export default class BrowserHelper extends webdriver.WebDriver {

	/**
	 * Builds a BrowserHelper.
	 */
	static async build() {
		const size = { width: 1280, height: 768 };

		const chromeOpts = new chrome.Options()
			.windowSize( size );
		const firefoxOpts = new firefox.Options()
			.windowSize( size );

		if ( ![ '0', 'false', 'no', '' ].includes( process.env.HEADLESS?.toLowerCase() ) ) {
			chromeOpts.headless();
			firefoxOpts.headless();
		}

		const driver = await new webdriver.Builder()
			.forBrowser( ( process.env.BROWSER ?? 'chrome' ).toLowerCase() )
			.setChromeOptions( chromeOpts )
			.setFirefoxOptions( firefoxOpts )
			.build();

		return new BrowserHelper( driver.getSession(), driver.getExecutor() );
	}

	/**
	 * Loads a Wikipedia page.
	 *
	 * @param targetPage
	 * @param testWiki
	 */
	async loadWikipediaPage(
		targetPage: string,
		testWiki?: boolean
	): Promise<BrowserHelper> {
		await this.get(
			`https://${testWiki ? 'test' : 'en'}.wikipedia.org/wiki/${
				encodeURIComponent( targetPage.trim().replace( / /g, '_' ) )
			}`
		);
		await this.wait( () => {
			// Wait until ResourceLoader is ready for use.
			return this.executeScript( 'return ((window.mw || {}).loader || {}).using' );
		} );
		return this;
	}

	/**
	 * Loads the Deputy script.
	 */
	async loadDeputyScript(): Promise<BrowserHelper> {
		const deputyScript = await fs.readFile(
			path.join( __dirname, '..', '..', 'build', 'deputy.js' )
		).then( f => f.toString( 'utf8' ) );
		await this.executeScript( deputyScript );
		await this.evaluate( () => {
			return new Promise<void>( ( res, rej ) => {
				mw.hook( 'deputy.load' ).add( () => {
					res();
				} );
				setTimeout( () => {
					rej();
				}, 30e3 );
			} );
		} );
		return this;
	}

	/**
	 * Take a screenshot of the active window.
	 *
	 * @return PNG binary data.
	 */
	async screenshot(): Promise<Buffer> {
		return Buffer.from( await this.takeScreenshot(), 'base64' );
	}

	/**
	 *
	 * @param func
	 * @param {...any} args
	 */
	async evaluate<T, U extends ( ...args: any[] ) => T>(
		func: U,
		...args: Parameters<U>
	): Promise<T> {
		return this.executeAsyncScript<T>(
			async function (
				_func: string,
				_args: Parameters<U>,
				callback: ( result: T ) => void
			) {
				// eslint-disable-next-line no-eval
				callback( await eval( _func )( ..._args ) );
			}, func, args
		);
	}

}
