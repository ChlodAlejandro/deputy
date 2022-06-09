mw.loader.using( [ 'mediawiki.Title' ], function () {

	if ( window.deputy ) {

		console.error( 'Deputy is loading twice! Exiting...' );
		return;
	}

	const baseUrl = 'http://localhost:45000';
	const messages = baseUrl + '/i18n/en.json';
	const pages = [
		'deputy.storage',
		'deputy.comms',
		'deputy.storage'
	];

	/**
	 * Actions to perform when the core has been loaded. Only the core and
	 * messages are loaded before all dependencies (and thus, synchronously relative
	 * to other loaded scripts).
	 */
	function coreReady() {
		const loadPromises: ( Promise<any>|JQuery.Promise<any> )[] =
			pages.map( ( p ) => mw.loader.getScript(
				`${baseUrl}/${p}.js`
			) ).concat( [
				baseUrl + '/broadcastchannel-polyfill.js',
				baseUrl + '/idb-keyval.js'
			].map( ( p ) => mw.loader.getScript( p ) ) );

		fetch( messages )
			.then( ( response ) => response.json() )
			.then( ( json ) => mw.messages.set( json ) )
			.then( () => {
				Promise.all( loadPromises ).then( function () {
					window.deputy.init();
				} );
			} );
	}

	mw.loader.getScript( baseUrl + '/deputy.core.js' )
		.then( () => { coreReady(); } );

} );
