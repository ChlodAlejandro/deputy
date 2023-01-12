/* eslint-disable max-len */
/*
 * Replacement polyfills for wikis that have no configured templates.
 * Used in WikiConfiguration, to permit a seamless OOB experience.
 */

/** `{{collapse top}}` equivalent */
export const collapseTop = `
{| class="mw-collapsible mw-collapsed" style="border:1px solid #C0C0C0;width:100%"
! <div style="background:#CCFFCC;">$1</div>
|-
|
`.trimStart();
/** `{{collapse bottom}}` equivalent */
export const collapseBottom = `
|}`;

/** `* {{subst:article-cv|1=$1}} $2 ~~~~` equivalent */
export const listingWikitext = '* [[$1]] $2 ~~~~';
/**
 * Polyfill for the following:
 * `; {{anchor|1={{delink|$1}}}} $1
 * $2
 * $3 ~~~~`
 */
export const batchListingWikitext = `*; <span style="display: none;" id="$1"></span> $1
$2
$3`;
/**
 * Inserted and chained as part of $2 in `batchListingWikitext`.
 * Equivalent of `* {{subst:article-cv|1=$1}}\n`. Newline is intentional.
 */
export const batchListingPageWikitext = '* [[$1]]\n';

/**
 * `{{subst:copyvio|url=$1|fullpage=$2}}` equivalent
 */
export const copyvioTop = `<div style="padding: 8px; border: 4px solid #0298b1;">
<div style="font-size: 1.2rem"><b>{{int:deputy.ia.content.copyvio}}</b></div>
<div>{{int:deputy.ia.content.copyvio.help}}</div>
{{if:$1|<div>{{if:$presumptive|{{int:deputy.ia.content.copyvio.from.pd}} $1|{{int:deputy.ia.content.copyvio.from}} $1}}</div>}}
</div>
<!-- {{int:deputy.ia.content.copyvio.content}} -->
<div class="copyvio" style="display: none">`;
/**
 * `{{subst:copyvio/bottom}}` equivalent.
 */
export const copyvioBottom = `
</div>`;
