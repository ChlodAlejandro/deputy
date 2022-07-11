# Deputy
[task tracking](https://trello.com/b/UmI82e0y/deputy)

Deputy is a [contributor copyright investigation](https://en.wikipedia.org/wiki/Wikipedia:Contributor_copyright_investigations) (CCI) assistance tool for Wikipedia. Its goal is to streamline the workflow for CCI case pages, making it easier to process and go through each case. As of now, it is in an extreme in-development phase, meaning most of the targeted features are not yet ready. Progress is done every day to accomplish the goals originally set.

Deputy exposes a `deputy` variable on the `window` object for public use. The API is documented at [chlodalejandro.github.io/deputy](https://chlodalejandro.github.io/deputy/classes/Deputy.html).

Deputy relies on modules from [Zoomiebot](https://github.com/ChlodAlejandro/zoomiebot/tree/master/bot/api/deputy/v1) to perform bulk data operations. Zoomiebot is hosted on Wikimedia Toolforge, more information can be found [here](https://github.com/ChlodAlejandro/zoomiebot#README).

## Testing
[Pre-alpha release `v0.0.1`](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.0.1) has been made as a technical demonstration. You may experiment with this version of Deputy, but keep in mind that it is **extremely unstable** and bugs may be found. Nevertheless, please [report bugs found](https://github.com/ChlodAlejandro/deputy/issues) so that they may be actioned on.

Starting version v0.1.0 (not yet released), Deputy's browser database will no longer be updated without proper handling of breaking changes. This will be the first version to be released on Wikipedia.

## Licensing

Copyright 2022 Chlod Aidan Alejandro

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

The userscript is bundled with multiple dependencies, all of which have been manually vetted for compatibility with the Apache License 2.0. The userscript, in particular, bundles with the following libraries:
* [tslib](https://github.com/Microsoft/tslib) - 0BSD, Microsoft - For TypeScript polyfills and helper functions.
* [idb](https://github.com/jakearchibald/idb) - ISC, Jake Archibald - IndexedDB wrapper for ease of use.
* [broadcastchannel-polyfill](https://github.com/JSmith01/broadcastchannel-polyfill) - Unlicense, Joshua Bell - Polyfill for BroadcastChannel (facilitates communication between tabs).
* [tsx-dom](https://github.com/Lusito/tsx-dom) - MIT, Santo Pfingsten - TSX/JSX that compiles to native `HTMLElement`s.

## Funding
The initial development of Deputy is covered by a [Wikimedia Foundation Rapid Grant](https://w.wiki/4xk$).
