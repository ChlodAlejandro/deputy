mw.loader.using( [ 'mediawiki.Title' ], function () {

	if ( window.deputy ) {
		// eslint-disable-next-line no-console
		console.error( 'Deputy is loading twice! Exiting...' );
		return;
	}

	const messages = 'http://localhost:45000/i18n/en.json';
	const pages = [
		'deputy.core'
	];

	const loadPromises: ( Promise<any>|JQuery.Promise<any> )[] =
		pages.map( ( p ) => mw.loader.getScript(
			`http://localhost:45000/${p}.js`
		) );

	fetch( messages )
		.then( ( response ) => response.json() )
		.then( ( json ) => mw.messages.set( json ) )
		.then( () => {
			Promise.all( loadPromises ).then( function () {
				window.deputy.init();
			} );
		} );

} );
