import webdriver from 'selenium-webdriver';
import type { Executor } from 'selenium-webdriver/lib/command';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PromiseOrNot } from '../../src/types';
import { WriteStream } from 'fs';

/**
 * Utility class for handling a browser environment during tests.
 */
export default class BrowserHelper extends webdriver.WebDriver {

	/**
	 * Builds a BrowserHelper.
	 */
	static async build() {
		const browser = ( process.env.BROWSER || 'chrome' ).toLowerCase();
		const size = { width: 1280, height: 768 };

		const chromeOpts = new chrome.Options()
			.windowSize( size );
		const firefoxOpts = new firefox.Options()
			.windowSize( size );

		if ( ![ '0', 'false', 'no', '' ].includes( process.env.HEADLESS?.toLowerCase() ) ) {
			chromeOpts.headless();

			if ( browser === 'firefox' ) {

				const browserVersion = process.env.BROWSER_VERSION || await ( async () => {
					console.log( 'Browser version not specified. Will attempt to guess ' +
						'(browser may open momentarily).' );
					return await new webdriver.Builder()
						.forBrowser( 'firefox' )
						.build()
						.then( async ( d ) => {
							const v = d.getCapabilities().then( c => c.getBrowserVersion() );
							await d.close();
							return v;
						} );
				} )();
				if ( +( /^(\d+)\./.exec( browserVersion )[ 1 ] ?? '56' ) > 55 ) {
					firefoxOpts.headless();
				}
			}
		}

		const logOptions = new webdriver.logging.Preferences();
		logOptions.setLevel( webdriver.logging.Type.BROWSER, webdriver.logging.Level.ALL );
		logOptions.setLevel( webdriver.logging.Type.CLIENT, webdriver.logging.Level.ALL );
		logOptions.setLevel( webdriver.logging.Type.DRIVER, webdriver.logging.Level.ALL );
		logOptions.setLevel( webdriver.logging.Type.PERFORMANCE, webdriver.logging.Level.ALL );
		logOptions.setLevel( webdriver.logging.Type.SERVER, webdriver.logging.Level.ALL );

		chromeOpts.setLoggingPrefs( logOptions );
		firefoxOpts.setLoggingPrefs( logOptions );

		const driver = await new webdriver.Builder()
			.setChromeOptions( chromeOpts )
			.setFirefoxOptions( firefoxOpts )
			.forBrowser( browser )
			.build();

		const logStreams: Record<string, WriteStream> = {};
		try {
			for ( const stream of await driver.manage().logs().getAvailableLogTypes() ) {
				logStreams[ stream ] = ( await fs.open(
					path.join( __dirname, '..', 'artifacts', `selenium-${
						stream.toLowerCase()
					}.log` ), 'a'
				) ).createWriteStream();
			}
		} catch ( e ) {
			console.warn( 'Browser does not support logs. Going in blind.' );
		}

		return new BrowserHelper( driver.getSession(), driver.getExecutor(), logStreams );
	}

	private readonly logStreams: Record<string, WriteStream>;

	/**
	 *
	 * @param session
	 * @param executor
	 * @param logStreams
	 */
	constructor(
		session: PromiseOrNot<webdriver.Session>,
		executor: Executor,
		logStreams?: Record<string, WriteStream>
	) {
		super( session, executor );

		if ( logStreams ) {
			this.logStreams = logStreams;
		}
	}

	/**
	 * @inheritDoc
	 */
	async close(): Promise<void> {
		await this.dumpLogs();
		await super.close();

		if ( this.logStreams ) {
			for ( const stream of Object.values( this.logStreams ) ) {
				await new Promise<void>( ( res, rej ) => {
					stream.close( ( err ) => {
						if ( err ) {
							rej( err );
						} else {
							res();
						}
					} );
				} );
			}
		}
	}

	/**
	 * Dumps all logs to the artifacts folder.
	 */
	async dumpLogs(): Promise<void> {
		const writePromises: Promise<void>[] = [];
		for ( const [ type, stream ] of Object.entries( this.logStreams ) ) {
			const logs = await this.manage().logs().get( type );

			for ( const entry of logs ) {
				writePromises.push( new Promise<void>( ( resolve, reject ) => {
					stream.write( `[${
						new Date( entry.timestamp ).toISOString()
					}][${
						entry.level
					}]${
						entry.type ? `[${entry.type}]` : ''
					} ${ entry.message }`, ( error ) => {
						if ( error ) {
							reject( error );
						} else {
							resolve();
						}
					} );
				} ) );
			}
		}
		await Promise.all( writePromises ).catch( ( e ) => {
			console.error( 'Error occurred when dumping logs.', e );
		} );
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
