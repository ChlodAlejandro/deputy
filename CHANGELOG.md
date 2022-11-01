# Unreleased
ヾ(•ω•`)o hai!
## Added
* [[`09fa40f`](../../commit/09fa40f)] Added "Dismiss" buttons to most banner messages 
* [[`5f97f34`](../../commit/5f97f34)] Added warning when attempting to archive unfinished section
## Fixed
* [[`d321ad5`](../../commit/d321ad5)] Fixed Deputy running over edit conflicts
* [[`d321ad5`](../../commit/d321ad5)] Fixed section lockup after saving

# [v0.2.0](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.2.0) - 2022-10-20
Small number of changes but relatively large in size; the contribution survey row detection now relies on a dedicated parser instead of regular expressions. This hopefully decreases the amount of false positive matches on contribution survey rows. In addition, support for the Dawkeye case, which has a different format from other CCI casepages, has been added. Also includes bugfixes.

## Added
* [[`e394ea6`](../../commit/e394ea6)] Added `mw.hook` hooks for integration tests
* [[`5cf6b07`](../../commit/5cf6b07)] Added support for Dawkeye-style cases (e.g., `{{dif|123|(+456)}}`)
* [[`1cb72b9`](../../commit/1cb72b9)] Added request limiter to prevent DoS'ing Deputy API

## Modified
* [[`effba5d`](../../commit/effba5d)] Changed browserslist string to "[cover 95% and not IE 11 and supports fetch](https://browserslist.dev/?q=Y292ZXIgOTUlIGFuZCBub3QgSUUgMTEgYW5kIHN1cHBvcnRzIGZldGNo)".
* [[`5ad0992`](../../commit/5ad0992)] Made row return original wikitext if unmodified (reverted by [[`2dc0405`](../../commit/2dc0405)])
* [[`2dc0405`](../../commit/2dc0405)] Moved row wikitext recognition to dedicated parser (from a regular expression)
* [[`7dfb394`](../../commit/7dfb394)] Hid "User:" prefix on contribution survey revisions
* [[`ac05d66`](../../commit/ac05d66)] Changed "close section" and "close" button labels on contribution survey sections to "archive" and "stop session"
* [[`df98dd8`](../../commit/df98dd8)] Switched from Puppeteer to Selenium for integration testing

## Bugs
* [[`6260a67`](../../commit/6260a67)] Fixed sessions not closing when all sections archived
* [[`6f254cc`](../../commit/6f254cc)] Fixed signing behavior key mismatch
* [[`b054845`](../../commit/b054845)] Fixed contribution survey rows responding even if in an invalid/errored state
* [[`e0fb84d`](../../commit/e0fb84d)] Fixed contribution survey row regular expression (superseded by [[`2dc0405`](../../commit/2dc0405)])

For a full list of changes, see [v0.1.1...v0.2.0](https://github.com/ChlodAlejandro/deputy/compare/v0.1.1...v0.2.0).

# [v0.1.1](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.1.1) - 2022-10-02
Minor bugfixes and improvements post-release.

## Added
* [[`14c1b81`](../../commit/14c1b81)] Added assessment option for presumptive removal
* [[`62892cf`](../../commit/62892cf)] Added option to stop signing all rows

## Modified
* [[`b9b49e0`](../../commit/b9b49e0)] Optimized contribution survey row revisions list

## Bugs
* [[`fbe5826`](../../commit/fbe5826)] Fixed section header regular expression for contribution survey sections

For a full list of changes, see [v0.1.0...v0.1.1](https://github.com/ChlodAlejandro/deputy/compare/v0.1.0...v0.1.1).

# [v0.1.0](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.1.0) - 2022-09-30
First public beta release of Deputy. First version to be published on the English Wikipedia.

## Added
* [[`d858fda`](../../commit/d858fda)] Added IA to the page toolbar
* [[`49a46e6`](../../commit/49a46e6)] Added user and wiki configurations
* [[`c4120ee`](../../commit/c4120ee)] Added preferences dialog
* [[`3c706ab`](../../commit/3c706ab)] (dev) Moved CPC response counter to repository scripts
* [[`d4c4dd4`](../../commit/d4c4dd4)] Added new listing buttons for copyright noticeboard pages
* [[`a692439`](../../commit/a692439)] Added about page to preferences dialog
* [[`65f0ed2`](../../commit/65f0ed2)] Added logo

## Modified
* [[`b7a81e4`](../../commit/b7a81e4)] Made improvements to the {{translated page}} UI
* [[`1f35b18`](../../commit/1f35b18)] Appended "et. seq" at the end of a {{translated page}} attribution edit summary
* [[`083f97d`](../../commit/083f97d)] Improved IA link detection
* [[`1b30163`](../../commit/1b30163)] Updated copyright problems response IDs
* [[`170354f`](../../commit/170354f)] `mw.message( ... ).text()` replaced with `mw.msg` shorthand
* [[`9fe01bb`](../../commit/9fe01bb)] Made sweeping localization improvements
* [[`23628da`](../../commit/23628da)] Made out-of-box experience improvements for other wikis

## Bugs
* [[`daa50d0`](../../commit/daa50d0)] Fixed IA success notification showing even when cancelling dialog
* [[`6a3706f`](../../commit/6a3706f)] Fixed IA reverting previous listing when two listings posted on the same page
* [[`0ffae10`](../../commit/0ffae10)] Fixed "undefined" appearing in copyright noticeboard listings
* [[`5c502c9`](../../commit/5c502c9)] Fixed {{translated page}} linking to the Russian Wikipedia all the time
* [[`3edf684`](../../commit/3edf684)] Fixed IA not releasing the page navigation block

For a full list of changes, see [v0.0.5...v0.1.0](https://github.com/ChlodAlejandro/deputy/compare/v0.0.5...v0.1.0).

# [v0.0.5](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.0.5) - 2022-08-31
This version includes a complete version of the reimplementation for the Infringement Assistant (IA). IA also comes with a standalone mode, which does not require Deputy to work. This reimplementation focuses on abstraction and UI changes, making it easier for users to submit listings to copyright problems noticeboards. In addition, it has a heavy focus on clerking, and now includes features that make it easy for noticeboard clerks to leave responses on listings.

## Added
* [[`7b850c0`](../../commit/7b850c0)] Reimplemented the Infringement Assistant (IA)
* [[`80c87da`](../../commit/80c87da)] ANTE: Added support for redirect talk pages

## Modified
* [[`f97e5b2`](../../commit/f97e5b2)] Continued renaming CTE to ANTE rename
* [[`e12dd8b`](../../commit/e12dd8b)] Allowed revision IDs in {{split article}} "diff" fields.
* [[`a5fd408`](../../commit/a5fd408)] Changed {{backwards copy}} "date" field to plain text (from type `date`)
* [[`e7d76c0`](../../commit/e7d76c0)] Began using `preview: true` for template previews ([T314623](https://phabricator.wikimedia.org/T314623))
* [[`b6d9d6d`](../../commit/b6d9d6d)] Improved `findNoticeSpot` recognition
* [[`258c177`](../../commit/258c177)] (dev) Moved MediaWiki-specific utilities to [wiki/util]

## Bugs
* [[`8e086e1`](../../commit/8e086e1)] Fixed TemplateMerger recursion

For a full list of changes, see [v0.0.4...v0.0.5](https://github.com/ChlodAlejandro/deputy/compare/v0.0.4...v0.0.5).

# [v0.0.4](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.0.4) - 2022-08-08
This version includes a complete version of the reimplementation for the {{copied}} Template Editor (CTE), now named the Attribution Notice Template Editor (ANTE). This includes support for all attribution notices that are most used on the English Wikipedia: {{split article}}, {{merged-to}}, {{merged-from}}, {{backwards copy}}, and {{translated page}}. Like before, ANTE also comes with a standalone mode, which does not require Deputy to work.

## Added
* [[`a33afa2`](../../commit/a33afa2)] CTE: {{split article}} support
* [[`333c07d`](../../commit/333c07d)] CTE: {{merged-from}} support
* [[`c8401ce`](../../commit/c8401ce)] CTE: {{merged-to}} support
* [[`7e58e22`](../../commit/7e58e22)] CTE: {{backwards-copy}} support
* [[`6bef573`](../../commit/6bef573)] CTE: {{translated page}} support

## Modified
* [[`da048de`](../../commit/da048de)] Abstracted CopiedTemplate class
* [[`3792eda`](../../commit/3792eda)] Made the CTE dialog reusable to preserve state when closing the dialog
* [[`4d0dea1`](../../commit/4d0dea1)] Split language files to avoid loading unnecessary bits for standalone scripts
* [[`d8ecb96`](../../commit/d8ecb96)] Abstracted attribution notices in the CTE ParsoidDocument subclass.
* [[`bc84517`](../../commit/bc84517)] Abstracted CTE dialog pages
* [[`9810a94`](../../commit/9810a94)] (dev) Reorganization of files
* [[`f340a41`](../../commit/f340a41)] Began building production files during CI/CD
* [[`79eaa4a`](../../commit/79eaa4a)] CTE renamed to Attribution Notice Template Editor (ANTE)

## Bugs
* [[`8e086e1`](../../commit/8e086e1)] Fixed TemplateMerger recursion

For a full list of changes, see [v0.0.3...v0.0.4](https://github.com/ChlodAlejandro/deputy/compare/v0.0.3...v0.0.4).

# [v0.0.3](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.0.3) - 2022-07-23
This version includes all features of the last pre-alpha and a reimplementation of the Copied Template Editor (CTE). The new reimplementation uses an improved version of ParsoidDocument, a library for easily accessing and modifying the Parsoid DOM from a browser context. This reimplementation paves (half of) the way towards support for other attribution notice templates. CTE is expected to be renamed to Attribution Notice Editor once support for other templates have been added. CTE also comes with a standalone mode, which does not require Deputy to work.

## Added
* [[`a7cc696`](../../commit/a7cc696)] Added talk page modifying class
* [[`525b181`](../../commit/525b181)] Added support for `mw.Rest`
* [[`726c827`](../../commit/726c827)] Reimplemented the {{copied}} Template Editor (CTE)
* [[`1299bf5`](../../commit/1299bf5)] Added CTE integration with Deputy
* [[`eedc8e7`](../../commit/eedc8e7)] Added automatic version synchronization

## Modified
* [[`ccaa572`](../../commit/ccaa572)] (dev) Converted OOUI ProcessDialog `OO.extendClass` to ES `extends`.

For a full list of changes, see [v0.0.2...v0.0.3](https://github.com/ChlodAlejandro/deputy/compare/v0.0.2...v0.0.3).

# [v0.0.2](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.0.2) - 2022-07-13
This version includes adds an "analysis" button on the page toolbar which has a few page analysis options (as of now, links to Earwig's Copyvio Detector runs for the current page revision and the revision being viewed).

## Added
* [[`d9a993a`](../../commit/d9a993a)] (dev) Added Dependabot configuration (@theresnotime)
* [[`6db4dc3`](../../commit/6db4dc3)] Added button for force-stopping an active session (on a different case page)
* [[`ca726f0`](../../commit/ca726f0)] Added analysis options on the page toolbar

For a full list of changes, see [v0.0.1...v0.0.2](https://github.com/ChlodAlejandro/deputy/compare/v0.0.1...v0.0.2).

# [v0.0.1](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.0.1) - 2022-07-11
First technical demonstration for Deputy. This version includes processing for case page sections and pages, including a toolbar on subject pages of an investigation that synchronize with the tab running Deputy.

For a full list of changes, see [v0.0.0...v0.0.1](https://github.com/ChlodAlejandro/deputy/compare/v0.0.0...v0.0.1).
