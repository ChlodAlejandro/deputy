# Deputy

<img align="right" width="70" height="70" alt="Deputy logo" src="https://upload.wikimedia.org/wikipedia/commons/2/2b/Deputy_logo.svg">

[Deputy](https://w.wiki/7NWR) is
a [contributor copyright investigation](https://en.wikipedia.org/wiki/Wikipedia:Contributor_copyright_investigations) (CCI) and copyright cleanup assistance tool for Wikipedia. Its goal is to streamline the workflow for CCI case pages, making it easier to
process and go through each case. As of now, it is in an extreme in-development phase, meaning most of the targeted
features are not yet ready. Progress is done every day to accomplish the goals originally set.

Deputy exposes a `deputy` variable on the `window` object for public use. The API is documented
at [chlodalejandro.github.io/deputy](https://chlodalejandro.github.io/deputy/classes/Deputy.html).

Deputy relies on modules from [Dispatch](https://github.com/ChlodAlejandro/deputy-dispatch) to
perform bulk data operations. Dispatch is hosted on Wikimedia Toolforge, more information can be
found [here](https://github.com/ChlodAlejandro/deputy-dispatch#README).

## Installation
See [User:Chlod/Scripts/Deputy § Installation](https://en.wikipedia.org/wiki/User:Chlod/Scripts/Deputy#Installation) on the English Wikipedia for more information.

## Developing

Run the development server with the following. Be sure to run `npm install` first to download required dependencies.

```shell
npm run dev
```

Import the script into your user JavaScript file of
choice ([common.js](https://en.wikipedia.org/wiki/Special:MyPage/common.js)) with the following:

```js
mw.loader.load( "http://localhost:45000/Deputy.js" );
mw.hook( 'deputy.preload' ).add( function () {
	// Replace resource root to load local development assets
	window.deputy.resourceRoot = { type: "url", url: new URL( "http://localhost:45000/" ) };
	window.deputy.getWikiConfig().then( function (wikiConfig) {
		// Used to test in a sandbox environment than on the actual CCI pagespace.
		// Feel free to change the values to fit your sandbox.
		wikiConfig.cci.rootPage.set(new mw.Title( 'User:Chlod/Scripts/Deputy/tests' ));
		wikiConfig.ia.rootPage.set(new mw.Title("User:Chlod/Scripts/Deputy/tests/Problems"));
	} );
} );
```

## Testing

### Live testing

Bleeding edge builds of Deputy are always provided through [GitHub Actions](https://github.com/ChlodAlejandro/deputy/actions). You may experiment with these versions of Deputy, but keep in mind that they are **extremely unstable**
and significant bugs may be found. Nevertheless,
please [report bugs found](https://github.com/ChlodAlejandro/deputy/issues) so that they may be actioned on.

### Automated testing

Unit and end-to-end tests exist for Deputy and can be found in the [`tests/`](tests) directory. These tests are run with
Selenium and Jest. This ensures that Deputy's most vital components work as expected. Tests are still incomplete and
coverage is not available, however by the end of the project, at least one end-to-end test should be finished.

You can trigger automated testing by running the following:

```shell
npm run test
```

You may also modify the browser to be used with Selenium using the `BROWSER` environment variable.

You **must** have the appropriate browser driver installed for whichever browser you wish to test on. If you want to test on Chrome browsers, run `npm i -g chromedriver@106.x` prior to running any tests (and change `106` to whichever version of Chrome you're using). For Firefox, run `npm i -g geckodriver`. Not having the proper browser driver installed with causes tests to fail.

Some automated tests require an internet connection as they load English Wikipedia pages. Ensure that you have a working (and decently fast) internet connection to pass tests.

## Licensing

```
Copyright 2022 Chlod Aidan Alejandro

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

The userscript is bundled with multiple dependencies, all of which have been manually vetted for compatibility with the
Apache License 2.0. The userscript, in particular, bundles with the following libraries:

* [tslib](https://github.com/Microsoft/tslib) - 0BSD, Microsoft - For TypeScript polyfills and helper functions.
* [idb](https://github.com/jakearchibald/idb) - ISC, Jake Archibald - IndexedDB wrapper for ease of use.
* [broadcastchannel-polyfill](https://github.com/JSmith01/broadcastchannel-polyfill) - Unlicense, Joshua Bell - Polyfill
  for BroadcastChannel (facilitates communication between tabs).
* [tsx-dom](https://github.com/Lusito/tsx-dom) - MIT, Santo Pfingsten - TSX/JSX that compiles to native `HTMLElement`s.

## Funding

The initial development of Deputy was covered by a [Wikimedia Foundation Rapid Grant](https://w.wiki/4xk$). Deputy is now being maintained through volunteer effort without compensation.
