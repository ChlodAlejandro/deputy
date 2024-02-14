# Untagged
``ヾ(•ω•`)o hai!``

These are changes that may or may not have been deployed to wikis, but are not yet considered as part of any release.

# [v0.6.0](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.5.0) - *2024-02-14*
Breaking change due to configuration version upgrade. This version allows Deputy to load rows where only a page is available (like for files and the WikiProject Tropical cyclones case) and includes improved handling of configuration version changes.
The latter was implemented to support changing the `ia.listingWikitextMatch` configuration field to allow processing for Copyright problems noticeboard listings which have mismatched IDs and links.

## Modified
* [[`da8d225`](../../commit/da8d225)] Gracefully handle rows with only a page title available
* [[`530d46c`](../../commit/530d46c)] Avoid loading newer configuration versions

## Bugs
* [[`c577afa`](../../commit/c577afa)] Fixed banner being inserted in the wrong element for DiscussionTools-using wikis
* [[`5dd6dc6`](../../commit/5dd6dc6)] Fixed missing listing error when responding to listing with mismatched ID and link
  * **BREAKING CHANGE!** Wikis must update their `ia.listingWikitextMatch` configuration fields to use
    the new capture groups.

For a granular list of changes, see [v0.5.1...v0.6.0](https://github.com/ChlodAlejandro/deputy/compare/v0.5.0...main).

# [v0.5.1](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.5.0) - *2023-12-21*

## Modified
* [[`640cc01`](../../commit/640cc01)] Moved User:Chlod/Scripts/Deputy links to Wikipedia:Deputy
* [[`3c73d02`](../../commit/3c73d02)] (dev) Re-enabled Firefox tests on Windows

## Bugs
* [[`964af59`](../../commit/964af59)] Fixed section breaking when bullet list not continuous (#31)

For a granular list of changes, see [v0.5.0...v0.5.1](https://github.com/ChlodAlejandro/deputy/compare/v0.5.0...v0.5.1).


# [v0.5.0](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.5.0) - *2023-09-12*
Generic patches and fixes. Added an announcements system for reaching users of Deputy. Also improved CCI case navigation and handling.

## Added
* [[`4cb3432`](../../commit/4cb3432)] Added button to navigate to previous unassessed revisions
* [[`6d212b1`](../../commit/6d212b1)] Added shorthand summary for case page assessment edit summaries
* [[`8c352a8`](../../commit/8c352a8)] Added proper support for missing (deleted/suppressed) revisions
* [[`adaab2f`](../../commit/adaab2f)] Added an announcements system
* [[`2374c07`](../../commit/2374c07)] Reintroduced template merging
* [[`b1cfbaf`](../../commit/b1cfbaf)] Added button in ANTE to automatically get date from revision ID
* [[`de7bd37`](../../commit/de7bd37)] Added Action API Api-User-Agent headers
* [[`7cb48de`](../../commit/7cb48de)] Added RESTBase Api-User-Agent headers
* [[`9ecbc4a`](../../commit/9ecbc4a)] Added support for change tags
* [[`df72d6e`](../../commit/df72d6e)] Added option for quick Earwig's Copyvio Detector links on CCI revisions
* [[`f294aec`](../../commit/f294aec)] Added suggestions for current page on page-related ANTE fields
* [[`d2cedac`](../../commit/d2cedac)] Added button in ANTE to automatically get latest revision ID from page
* [[`3684db3`](../../commit/3684db3)] Added a "diff" dropdown button for revisions
* [[`b464ff8`](../../commit/b464ff8)] Added option to automatically open diffs for certain thresholds

## Modified
* [[`c77ad39`](../../commit/c77ad39)] Made page toolbar appear as long as a session was active
* [[`51330ac`](../../commit/51330ac)] Made page toolbar only show when viewing normally, viewing a diff, or viewing a permanent link
* [[`3d552a7`](../../commit/3d552a7)] Made sections unsave-able if there is are still unassessed revisions
* [[`79a1e59`](../../commit/79a1e59)] Made DateInputWidget dropdown show upwards
* [[`b2a7dde`](../../commit/b2a7dde)] Changed homepage to link to new [Wikipedia:Deputy](https://w.wiki/7NWR) home
* [[`bb453f3`](../../commit/bb453f3)] Hid user by default in CCI revisions

## Bugs
* [[`c77ad39`](../../commit/c77ad39)] Fixed revisions not working when the page title doesn't match
* [[`ff55837`](../../commit/ff55837)] Fixed "Force UTC time" only taking effect on dates
* [[`2470f56`](../../commit/2470f56)] Fixed error when saving a section without making savable changes
* [[`e790fb7`](../../commit/e790fb7)] Fixed incorrect message key in ANTE template with demo parameter enabled
* [[`ec1bd49`](../../commit/ec1bd49)] Fixed how links appear in the CCI interface
* [[`4446402`](../../commit/4446402)] Fixed missing revisions appearing improperly
* [[`b8a5975`](../../commit/b8a5975)] Fixed z-index issues with confirmation dialogs
* [[`b45cc88`](../../commit/b45cc88)] Fixed title parsing issue when attrib. notice field is empty
* [[`e35904d`](../../commit/e35904d)] Fixed wiki configuration changes not applying
* [[`ae127dc`](../../commit/ae127dc)] Fixed dates being incorrectly set for negative UTC offsets
* [[`97bb369`](../../commit/97bb369)] Fixed problems with element classes when revision tag has spaces or symbols

For a granular list of changes, see [v0.4.2...v0.5.0](https://github.com/ChlodAlejandro/deputy/compare/v0.4.2...v0.5.0).

# [v0.4.2](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.4.2) - 2023-03-23
Another set of patches and fixes.

## Modified
* [[`0aeeb4d`](../../commit/0aeeb4d)] Hid `lastEdited` option from wiki configuration editor
* [[`b9e7f83`](../../commit/b9e7f83)] Moved wiki configuration to localStorage instead of MediaWiki options
* [[`866cdee`](../../commit/866cdee)] (dev) Added automatically-generated utility index files
* [[`04ba5ce`](../../commit/04ba5ce)] Exposed utility functions onto Deputy global object
* [[`cb639dc`](../../commit/cb639dc)] Added z-index to page toolbar
* [[`3e0f425`](../../commit/3e0f425)] Increased page toolbar timeout for page details

## Bugs
* [[`595ce69`](../../commit/595ce69)] Fixed broken pre-2014 case style processing
* [[`9fcbd0f`](../../commit/9fcbd0f)] Fixed comment rows causing parser to throw errors

For a granular list of changes, see [v0.4.1...v0.4.2](https://github.com/ChlodAlejandro/deputy/compare/v0.4.1...v0.4.2).

# [v0.4.1](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.4.1) - 2023-01-18

Small patch, big leap. This patch switches Deputy over to using the dedicated [Deputy Dispatch tool](https://deputy.toolforge.org/) instead of the Zoomiebot Deputy module. For more information about Dispatch, see its [GitHub repository](https://github.com/ChlodAlejandro/deputy-dispatch).

## Modified
* [[`c7b4f5f`](../../commit/c7b4f5f)] Changed default Dispatch endpoint to dedicated tool
* [[`c423d23`](../../commit/c423d23)] (dev) Changed API class name to "DeputyDispatch"

## Bugs
* [[`c08f1c0`](../../commit/c08f1c0)] Fixed bad cleanup due to DiscussionTools parser HTML changes

For a granular list of changes, see [v0.4.0...v0.4.1](https://github.com/ChlodAlejandro/deputy/compare/v0.4.0...v0.4.1).

# [v0.4.0](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.4.0) - 2023-01-12
A few significant changes and bugfixes. Most notably, a new "presumptive deletion" option for Infringement Assistant has been added for wikis with a CCI process. This allows users to report pages with presumptive deletions on-wiki. This requires wiki-wide enabling, and can be toggled by administrators on other wikis.

Changes and updates on user and wiki configurations have been streamlined. Now, Deputy will updated your user configuration on ALL tabs once you change it on one tab. No need to reload to apply changes. As for changes to the wiki configuration, Deputy now stores the time a configuration was last edited within the script. When a change is detected (on page load), a message is automatically sent to invalidate all outdated configurations, and the appropriate notices are shown. Note that this will only work with Deputy, and not standalone modules (which do not ship inter-tab communication features).

Aside from that, this update brings a few needed bugfixes.

## Added
* [[`480d81f`](../../commit/480d81f)] Added fields for presumptive deletion in IA single page workflow dialog
* [[`0268848`](../../commit/0268848)] Added panel for additional editor comments on unfinished rows
* [[`3010f8d`](../../commit/3010f8d)] Added alerts for outdated wiki-wide configurations

## Modified
* [[`03a9505`](../../commit/03a9505)] Improved revision switching in page toolbar
* [[`03a9505`](../../commit/03a9505)] Began showing page toolbar regardless of diff view
* [[`f5a29d2`](../../commit/f5a29d2)] Stopped parsing rows that weren't found as an HTML element
* [[`31d621a`](../../commit/31d621a)] Improved i18n-related functions
* [[`214180e`](../../commit/214180e)] Began applying user configuration changes on all tabs when changed

## Bugs
* [[`ab937d9`](../../commit/ab937d9)] (dev) Fixed `mw` typing being missing from tests
* [[`13892d7`](../../commit/13892d7)] Fixed accidental use of `getNameText` instead of `getMainText`
* [[`d556250`](../../commit/d08d091)] Fixed {{copyvio}} templates bearing "$1" instead of the reported URL

For a granular list of changes, see [v0.3.1...v0.4.0](https://github.com/ChlodAlejandro/deputy/compare/v0.3.1...v0.4.0).

# [v0.3.1](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.3.1) - 2022-12-17
General bugfix and quality-of-life fixes.

## Modified
* [[`5c56c26`](../../commit/5c56c26)] Began purging the main copyright problems listing page after listing post
* [[`64333e4`](../../commit/64333e4)] Tweaked listing detection to avoid "edit section" links

## Bugs
* [[`0dd03d9`](../../commit/0dd03d9)] Fixed sections not being parsed properly when the section name has numbers
* [[`efac058`](../../commit/efac058)] Fixed improper revision navigation with the revision toolbar
* [[`360221a`](../../commit/360221a)] Fixed newlines not being inserted when posting listings
* [[`e3df95c`](../../commit/e3df95c)] Fixed wrong notify message being sent for listing-only reports

For a granular list of changes, see [v0.3.0...v0.3.1](https://github.com/ChlodAlejandro/deputy/compare/v0.3.0...v0.3.1).

# [v0.3.0](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.3.0) - 2022-11-24
Sweeping bugsquashes and improved compatibility for historical cases. Also added options to decentralize APIs, especially with [Dispatch](https://github.com/ChlodAlejandro/deputy-dispatch) on the way.

## Added
* [[`51dd560`](../../commit/51dd560)] Added specific version data (commit, branch, date) to about page
* [[`f236b2e`](../../commit/f236b2e)] Added option to configure session continuation behavior
* [[`bd2b9c7`](../../commit/bd2b9c7)] Added option to customize Deputy Dispatch (Deputy API) root endpoint
* [[`bd2b9c7`](../../commit/bd2b9c7)] Added option to customize Earwig's Copyvio Tool root endpoint

## Modified
* [[`def323f`](../../commit/def323f)] Fully moved versioning to package.json
* [[`f236b2e`](../../commit/f236b2e)] Changed session continuation to avoid loading past active sessions by default
* [[`211fdd2`](../../commit/211fdd2)] (dev) Started using section anchor ID instead of name for case page caching
* [[`6a12e09`](../../commit/6a12e09)] Improved handling of wiki-wide configuration dialog

## Bugs
* [[`0d3524d`](../../commit/0d3524d)] Fixed the banner for tabs with active cases on another tab being missing
* [[`e3a028f`](../../commit/e3a028f)] Fixed the start and continue links using serifs
* [[`266f0c8`](../../commit/266f0c8)] Fixed section loading rows of other sections of the same name
* [[`5e2b60f`](../../commit/5e2b60f)] Fixed sections of the same name all activating on startup
* [[`11e1c60`](../../commit/11e1c60)] Fixed ContributionSurveyRow attempting to reply to row requests when errored
* [[`58322f8`](../../commit/58322f8)] Fixed wrong list element being appended post-section close
* [[`965a093`](../../commit/965a093)] Fixed section heading getting replaced post-save (destroys anchor ID)
* [[`29a42ea`](../../commit/29a42ea)] Fixed incorrect revision sorting due to historical surveyor differences

For a granular list of changes, see [v0.2.2...v0.3.0](https://github.com/ChlodAlejandro/deputy/compare/v0.2.2...v0.3.0).

# [v0.2.2](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.2.2) - 2022-11-04
Very small update with one bugfix and one quality-of-life feature.

## Added
* [[`06830e5`](../../commit/06830e5)] Added a banner and button for previewing hidden copyright violations

## Modified
* [[`154a339`](../../commit/154a339)] (dev) Removed development script and replaced with concurrent commands

## Bugs
* [[`8f4f29b`](../../commit/8f4f29b)] Fixed section archive warning not updating when all revisions checked post-open

For a granular list of changes, see [v0.2.1...v0.2.2](https://github.com/ChlodAlejandro/deputy/compare/v0.2.1...v0.2.2).

# [v0.2.1](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.2.1) - 2022-11-01
~~Halloween update! (I'm late)~~ Small quality of life changes and significant bugfixes.

## Added
* [[`09fa40f`](../../commit/09fa40f)] Added "Dismiss" buttons to most banner messages 
* [[`5f97f34`](../../commit/5f97f34)] Added warning when attempting to archive unfinished section

## Bugs
* [[`d321ad5`](../../commit/d321ad5)] Fixed Deputy running over edit conflicts
* [[`d321ad5`](../../commit/d321ad5)] Fixed section lockup after saving

For a granular list of changes, see [v0.2.0...v0.2.1](https://github.com/ChlodAlejandro/deputy/compare/v0.2.0...v0.2.1).

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

For a granular list of changes, see [v0.1.1...v0.2.0](https://github.com/ChlodAlejandro/deputy/compare/v0.1.1...v0.2.0).

# [v0.1.1](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.1.1) - 2022-10-02
Minor bugfixes and improvements post-release.

## Added
* [[`14c1b81`](../../commit/14c1b81)] Added assessment option for presumptive removal
* [[`62892cf`](../../commit/62892cf)] Added option to stop signing all rows

## Modified
* [[`b9b49e0`](../../commit/b9b49e0)] Optimized contribution survey row revisions list

## Bugs
* [[`fbe5826`](../../commit/fbe5826)] Fixed section header regular expression for contribution survey sections

For a granular list of changes, see [v0.1.0...v0.1.1](https://github.com/ChlodAlejandro/deputy/compare/v0.1.0...v0.1.1).

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

For a granular list of changes, see [v0.0.5...v0.1.0](https://github.com/ChlodAlejandro/deputy/compare/v0.0.5...v0.1.0).

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

For a granular list of changes, see [v0.0.4...v0.0.5](https://github.com/ChlodAlejandro/deputy/compare/v0.0.4...v0.0.5).

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

For a granular list of changes, see [v0.0.3...v0.0.4](https://github.com/ChlodAlejandro/deputy/compare/v0.0.3...v0.0.4).

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

For a granular list of changes, see [v0.0.2...v0.0.3](https://github.com/ChlodAlejandro/deputy/compare/v0.0.2...v0.0.3).

# [v0.0.2](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.0.2) - 2022-07-13
This version includes adds an "analysis" button on the page toolbar which has a few page analysis options (as of now, links to Earwig's Copyvio Detector runs for the current page revision and the revision being viewed).

## Added
* [[`d9a993a`](../../commit/d9a993a)] (dev) Added Dependabot configuration (@theresnotime)
* [[`6db4dc3`](../../commit/6db4dc3)] Added button for force-stopping an active session (on a different case page)
* [[`ca726f0`](../../commit/ca726f0)] Added analysis options on the page toolbar

For a granular list of changes, see [v0.0.1...v0.0.2](https://github.com/ChlodAlejandro/deputy/compare/v0.0.1...v0.0.2).

# [v0.0.1](https://github.com/ChlodAlejandro/deputy/releases/tag/v0.0.1) - 2022-07-11
First technical demonstration for Deputy. This version includes processing for case page sections and pages, including a toolbar on subject pages of an investigation that synchronize with the tab running Deputy.

For a granular list of changes, see [v0.0.0...v0.0.1](https://github.com/ChlodAlejandro/deputy/compare/v0.0.0...v0.0.1).
