/* eslint-disable */
/**
 * Counts the number of instances of {{CPC}} transclusions in the Wikipedia:Copyright problems pagespace.
 *
 * @license MIT
 */
const axios = require( 'axios' );

/**
 * The revision number of {{cpc}} at the time of writing. This is checked
 * later on and will cause the script to fail if the version does not
 * match the latest (so that changes to text are properly accounted for).
 *
 * @type {number}
 */
const cpcVersion = 1218931021;

( async () => {

	console.log("Checking if CPC template has changed...");

	const isOutdated = axios.post(
		"https://en.wikipedia.org/w/api.php",
		new URLSearchParams( {
			action: "query",
			format: "json",
			formatversion: "2",
			titles: "Template:CPC",
			prop: "revisions",
			rvprop: "ids"
		} ),
		{ responseType: "json" }
	).then( v => v.data.query.pages[0].revisions[0].revid !== cpcVersion);

	if ( await isOutdated ) {
		console.error( " CPC template has changed. Please update the script." );
		process.exit( 1 );
	} else {
		console.log(" CPC template up to date!");
	}

	console.log("Conducting search of CPC templates...");

	// Tags where there shouldn't be a -1.
	const nonClosingTags = [
		// Removed with [[Special:Diff/1218925424]]
		// "deferred",
		"vrt",
		// Removed with [[Special:Diff/1218925424]]
		// "unverified",
		"viable"
	];

	// 'old text': 'current ID'
	// Capitalization and punctuation are ignored, but included for .
	const queries = {
		// [[Special:PermanentLink/321549245]]
		// Instances covered by later version ([[Special:PermanentLink/1218925424]])
		// 'Permission plausible. Article relisted under today': 'relist',
		'Article cleaned by investigator or others. No remaining infringement': 'cleaned',
		// Removed with [[Special:Diff/1218925424]]
		// 'Copyright concerns remain. Article deleted, left CUP notice': 'deletedcup',
		'No copyright concern. Material PD or appropriately licensed for use': 'no',
		"User was not notified, relisting under today's entry": 'user',
		// Renamed from "OTRS" with [[Special:Diff/1218925424]]
		"OTRS pending but not yet verified, relisting under today's entry": 'vrt',

		// [[Special:PermanentLink/321549827]]
		'No vio found, claim cannot be validated. Tag removed from article': 'where',

		// [[Special:PermanentLink/322101343]]
		"OTRS Ticket received, article now licensed and compatible with CC-BY-SA": 'ticket',

		// [[Special:PermanentLink/323442606]]
		'Article redirected to a non-infringing target': 'redirect',
		// Removed with [[Special:Diff/1218925424]]
		// 'Deferred to old issues': 'deferred',

		// [[Special:PermanentLink/401281430]]
		// Removed with [[Special:Diff/1110556291]]
		// 'No source found; copy-paste tag removed and cv-unsure tag placed at article talk': 'unsure',

		// [[Special:PermanentLink/403019514]]
		'Backwardscopy. Tag and explanation placed at talk page': 'backwards',

		// [[Special:PermanentLink/431484027]]
		'Article cleaned, still needs a history purge to remove original copyvio': 'histpurge',
		'Purged. Copyright problem removed from history': 'purged',

		// [[Special:PermanentLink/431659239]]
		// Removed with [[Special:Diff/1106646781]]
		// 'Resolved; clerk recommendation implemented': 'implemented',
		'Viable rewrite proposed; rewrite on temp page can be used to replace problematic article': 'viable',
		'Rewrite requires merge; viable rewrite at temp space requires history merge into article': 'move',

		// [[Special:PermanentLink/431662870]]
		// Removed with [[Special:Diff/1218925424]]
		// 'Permission unverified as of this tagging; article will need to be deleted if that does not change': 'unverified',

		// [[Special:PermanentLink/436665142]]
		// Instances covered by later version ([[Special:PermanentLink/674253997]])
		// 'Article deleted. Article deleted for a reason other than copyright concerns': 'deletedother',

		// [[Special:PermanentLink/478165583]]
		'Issue resolved': 'resolved',

		// [[Special:PermanentLink/484775988]]
		// case-insensitive, also catches [[Special:Diff/528882122]]
		'Backwardscopy. Attributes Wikipedia': 'backwardsattributed',

		// [[Special:PermanentLink/533466084]]
		// Renamed from "deletedcv" with [[Special:Diff/1218925424]]
		'Article deleted due to copyright concerns': 'deleted',

		// [[Special:PermanentLink/674253997]]
		'Article deleted for a reason other than copyright concerns': 'deletedother',

		// [[Special:PermanentLink/973160274]]
		"OTRS Ticket received, article now licensed and compatible with CC BY-SA 3.0": 'ticket',

		// [[Special:PermanentLink/1058020969]]
		'VRT Ticket received, article now licensed and compatible with CC BY-SA 3.0': 'ticket',
		// Renamed from "OTRS" with [[Special:Diff/1218925424]]
		"VRT pending but not yet verified, relisting under today's entry": 'vrt',

		// [[Special:PermanentLink/1105401498]]
		'No copyright concern. Material is PD, license compatible, or ineligible for copyright protection': 'no',
		'Backwardscopy. Tag placed at talk page': 'backwards',

		// [[Special:PermanentLink/1105835801]]
		// Removed with [[Special:Diff/1218925424]]
		// 'Copyright concerns remain. Article deleted, left {{Cup}} notice': 'deletedcup',
		'Rewrite merged to article': 'move',
		'Viable rewrite proposed; rewrite on temp page can be merged into the article': 'viable',

		// [[Special:PermanentLink/1105836248]]
		'Rewrite moved into place': 'move',

		// [[Special:PermanentLink/1106449928]]
		'Article cleaned, revision deletion requested': 'histpurge',
		// Instances covered by later version ([[Special:PermanentLink/1218925424]])
		// 'Revision deletion completed. Copyright problem removed from history': 'purged',

		// [[Special:PermanentLink/1106646781]]
		// Instances covered by later version ([[Special:PermanentLink/1218925424]])
		// 'Blanked and relisted under today': 'blanked',

		// [[Special:PermanentLink/1110556291]]
		// Instances covered by later version ([[Special:PermanentLink/1218925424]])
		"User was not notified, relisted under today": "user",

		// [[Special:PermanentLink/1171074480]]
		"Already rewritten. No infringing content remains": "alreadyrewritten",

		// [[Special:PermanentLink/1218925424]]
		'Blanked and relisted': 'blanked',
		'Permission unverified, article is unable to be compatibly licensed': 'fail',
		'Revision deletion completed': 'purged',
		'Permission plausible. Article relisted': 'relist',
		'VRT Ticket verified, article now licensed and compatible with CC BY-SA 4.0': 'ticket',
		'User was not notified, relisted': 'user',
	};

	// Reverse queries. Overwrite with the latest occurrence.
	const templates = {};
	for ( const [ query, key ] of Object.entries( queries ) ) {
		templates[ key ] = query;
	}

	const counts = {};

	for ( const [ query, key ] of Object.entries( queries ) ) {
		const req = await axios.post( 'https://en.wikipedia.org/w/api.php', new URLSearchParams( {
			action: 'query',
			format: 'json',
			formatversion: '2',
			list: 'search',
			srsearch: `intitle:\"Copyright problems\" \"${query}\"`,
			srnamespace: '4',
			srwhat: 'text',
			srinfo: 'totalhits',
			srprop: ''
		} ), { responseType: 'json' } );

		console.log( ` [${req.data.query[ 'searchinfo' ][ 'totalhits' ]}] "${ query }"` );
		counts[ key ] = ( counts[ key ] || 0 ) + req.data.query[ 'searchinfo' ][ 'totalhits' ];
	}

	console.log( '\nSorting...\n' );

	const sortedCounts = Object.entries( counts )
		.sort( ( a, b ) => b[ 1 ] - a[ 1 ] );

	const longestValue = sortedCounts[0][1].toString().length;
	for ( const [ key, count ] of sortedCounts ) {
		const n = `${count}`;
		console.log( ` [ ${
			' '.repeat(Math.max(0, longestValue - n.length))
		}${n} ] ${key}` );
	}

	console.log(); // extra newline

	const out = [];
	for ( const [ key ] of sortedCounts ) {
		out.push( {
			template: `{{subst:CPC|${key}|$2}}`,
			label: templates[key],
			closing: nonClosingTags.includes( key ) ? false : undefined
		} );
	}
	console.log( JSON.stringify( out, null, 4 ) );

	console.log();

	console.log("Verify the templates above with the following wikitext:");
	console.log(`{| class="wikitable" \n${
		out.map( ( { template, label } ) => `|-\n! style="text-align: left" | ${
			label
				.replace( /\{\{/g, "<nowiki>{{</nowiki>" )
				.replace( /}}/g, "<nowiki>}}</nowiki>" )
		}\n|-\n| ${
			template
				.replace( /(\{\{\s*)(subst:\s*)/g, "$1safe$2" )
		}` ).join( '\n' )
	}\n|}`);

} )();
/*!
* Copyright © 2022 Chlod Aidan Alejandro
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software
* and associated documentation files (the “Software”), to deal in the Software without restriction,
* including without limitation the rights to use, copy, modify, merge, publish, distribute,
* sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or
* substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
* NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
* DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
* OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
