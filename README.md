# Deputy
[task tracking](https://trello.com/b/UmI82e0y/deputy)

Deputy is a [contributor copyright investigation](https://en.wikipedia.org/wiki/Wikipedia:Contributor_copyright_investigations) (CCI) assistance tool for Wikipedia. Its goal is to streamline the workflow for CCI case pages, making it easier to process and go through each case. As of now, it is in an extreme in-development phase, meaning most of the targeted features are not yet ready. Progress is done every day to accomplish the goals originally set.

Deputy exposes a `deputy` variable on the `window` object for public use. The API is documented at [chlodalejandro.github.io/deputy](https://chlodalejandro.github.io/deputy/classes/Deputy.html).

Deputy relies on modules from [Zoomiebot](https://github.com/ChlodAlejandro/zoomiebot/tree/master/bot/api/deputy/v1) to perform bulk data operations. Zoomiebot is hosted on Wikimedia Toolforge, more information can be found [here](https://github.com/ChlodAlejandro/zoomiebot#README).

## Developing
Run the development server with the following. Be sure to run `npm install` first to download required dependencies.
```shell
npm run dev
```

Import the script into your user JavaScript file of choice ([common.js](https://en.wikipedia.org/wiki/Special:MyPage/common.js)) with the following:
```js
mw.loader.load("http://localhost:45000/Deputy.js");
mw.hook( 'deputy.preload' ).add( function () {
	// Used to test in a sandbox environment than on the actual CCI pagespace.
    // Feel free to change the values to fit your sandbox.
	window.deputy.DeputyCase.rootPage = new mw.Title( 'User:Chlod/Scripts/Deputy/tests' );
	window.deputy.DeputyCasePage.rootPage = new mw.Title( 'User:Chlod/Scripts/Deputy/tests' );
} );
```

This project uses TypeScript, but some parts of the tool are weakly-typed. This is due to a lack of types and unorthodox JavaScript patterns on the part of reliant libraries, namely [OOUI](https://www.mediawiki.org/wiki/OOUI), which makes it difficult to enforce types. Tread carefully when modifying files that extend off of OOUI widgets or similar, as the use of many `any` types may prevent you from knowing when something might break.

## Testing

### Live testing
[Pre-alpha release `v0.0.1`](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.0.1) has been made as a technical demonstration. You may experiment with this version of Deputy, but keep in mind that it is **extremely unstable** and bugs may be found. Nevertheless, please [report bugs found](https://github.com/ChlodAlejandro/deputy/issues) so that they may be actioned on.

Starting version v0.1.0 (not yet released), Deputy's browser database will no longer be updated without proper handling of breaking changes. This will be the first version to be released on Wikipedia.

### Automated testing
Unit and end-to-end tests exist for Deputy and can be found in the [`tests/`](tests) directory. These tests are run with Puppeteer and Jest. This ensures that Deputy's most vital components work as expected. Tests are still incomplete and coverage is not available, however by the end of the project, at least one end-to-end test should be finished.

You can trigger automated testing by running the following:
```shell
npm run test
```

You may also modify the browser to be used with Puppeteer using the `PUPPETEER_PRODUCT` environment variable. See the [Puppeteer documentation](https://pptr.dev/#environment-variables) for more information. Automated tests are also run on GitHub, a log of which can be found [here](https://github.com/ChlodAlejandro/deputy/actions/workflows/ci-cd.yml).

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

The userscript is bundled with multiple dependencies, all of which have been manually vetted for compatibility with the Apache License 2.0. The userscript, in particular, bundles with the following libraries:
* [tslib](https://github.com/Microsoft/tslib) - 0BSD, Microsoft - For TypeScript polyfills and helper functions.
* [idb](https://github.com/jakearchibald/idb) - ISC, Jake Archibald - IndexedDB wrapper for ease of use.
* [broadcastchannel-polyfill](https://github.com/JSmith01/broadcastchannel-polyfill) - Unlicense, Joshua Bell - Polyfill for BroadcastChannel (facilitates communication between tabs).
* [tsx-dom](https://github.com/Lusito/tsx-dom) - MIT, Santo Pfingsten - TSX/JSX that compiles to native `HTMLElement`s.

## Funding
The initial development of Deputy is covered by a [Wikimedia Foundation Rapid Grant](https://w.wiki/4xk$).
