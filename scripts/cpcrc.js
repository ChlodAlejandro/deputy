/* eslint-disable */
/**
 * Counts the number of instances of {{CPC}} transclusions in the Wikipedia:Copyright problems pagespace.
 * ================================================================================================
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
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const axios = require( 'axios' );
( async () => {

	// Tags where there shouldn't be a -1.
	const nonClosingTags = [ 'deferred', 'OTRS', 'unverified', 'viable' ];

	// 'old text': 'current ID'
	// Capitalization and punctuation are ignored, but included for .
	const queries = {
		// [[Special:PermanentLink/321549245]]
		'Permission plausible Article relisted under today.': 'relist',
		'Article cleaned by investigator or others. No remaining infringement.': 'cleaned',
		'Copyright concerns remain. Article deleted, left CUP notice.': 'deletedcup',
		'No copyright concern. Material PD or appropriately licensed for use': 'no',
		"User was not notified, relisting under today's entry.": 'user',
		"OTRS pending but not yet verified, relisting under today's entry.": 'OTRS',

		// [[Special:PermanentLink/321549827]]
		'No vio found, claim cannot be validated. Tag removed from article.': 'where',

		// [[Special:PermanentLink/322101343]]
		"OTRS Ticket received, article now licensed and compatible with CC-BY-SA.": 'ticket',

		// [[Special:PermanentLink/323442606]]
		'Article redirected to a non-infringing target.': 'redirect',
		'Deferred to old issues.': 'deferred',

		// [[Special:PermanentLink/401281430]]
		// Removed with [[Special:Diff/1110556291]]
		// 'No source found; copy-paste tag removed and cv-unsure tag placed at article talk.': 'unsure',

		// [[Special:PermanentLink/403019514]]
		'Backwardscopy. Tag and explanation placed at talk page.': 'backwards',

		// [[Special:PermanentLink/431484027]]
		'Article cleaned, still needs a history purge to remove original copyvio': 'histpurge',
		'Purged. Copyright problem removed from history.': 'purged',

		// [[Special:PermanentLink/431659239]]
		// Removed with [[Special:Diff/1106646781]]
		// 'Resolved; clerk recommendation implemented.': 'implemented',
		'Viable rewrite proposed; rewrite on temp page can be used to replace problematic article.': 'viable',
		'Rewrite requires merge; viable rewrite at temp space requires history merge into article.': 'move',

		// [[Special:PermanentLink/431662870]]
		'Permission unverified as of this tagging; article will need to be deleted if that does not change.': 'unverified',

		// [[Special:PermanentLink/436665142]]
		// Instances covered by later version ([[Special:PermanentLink/674253997]])
		// 'Article deleted. Article deleted for a reason other than copyright concerns.': 'deletedother',

		// [[Special:PermanentLink/478165583]]
		'Issue resolved.': 'resolved',

		// [[Special:PermanentLink/484775988]]
		// case-insensitive, also catches [[Special:Diff/528882122]]
		'Backwardscopy. Attributes Wikipedia.': 'backwardsattributed',

		// [[Special:PermanentLink/533466084]]
		'Article deleted due to copyright concerns.': 'deletedcv',

		// [[Special:PermanentLink/674253997]]
		'Article deleted for a reason other than copyright concerns.': 'deletedother',

		// [[Special:PermanentLink/973160274]]
		"OTRS Ticket received, article now licensed and compatible with CC BY-SA 3.0.": 'ticket',

		// [[Special:PermanentLink/1058020969]]
		'VRT Ticket received, article now licensed and compatible with CC BY-SA 3.0.': 'ticket',
		"VRT pending but not yet verified, relisting under today's entry.": 'OTRS',

		// [[Special:PermanentLink/1105401498]]
		'No copyright concern. Material is PD, license compatible, or ineligible for copyright protection.': 'no',
		'Backwardscopy. Tag placed at talk page.': 'backwards',

		// [[Special:PermanentLink/1105835801]]
		'Copyright concerns remain. Article deleted, left {{Cup}} notice.': 'deletedcup',
		'Rewrite merged to article.': 'move',
		'Viable rewrite proposed; rewrite on temp page can be merged into the article.': 'viable',

		// [[Special:PermanentLink/1105836248]]
		'Rewrite moved into place.': 'move',

		// [[Special:PermanentLink/1106449928]]
		'Article cleaned, revision deletion requested.': 'histpurge',
		'Revision deletion completed. Copyright problem removed from history.': 'purged',

		// [[Special:PermanentLink/1106646781]]
		'Blanked and relisted under today.': 'blanked',

		// [[Special:PermanentLink/1110556291]]
		"User was not notified, relisted under today": "user"
	};

	// Reverse queries. Overwrite with latest occurrence.
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
		console.log( query + ': ' + req.data.query.searchinfo.totalhits );
		counts[ key ] = ( counts[ key ] || 0 ) + req.data.query.searchinfo.totalhits;
	}

	console.log( '\nSORTING...\n' );

	const sortedCounts = Object.entries( counts )
		.sort( ( a, b ) => b[ 1 ] - a[ 1 ] );

	const out = [];
	for ( const [ key ] of sortedCounts ) {
		out.push( {
			id: key,
			label: templates[key],
			closing: nonClosingTags.includes( key ) ? false : undefined
		} );
	}
	console.log( JSON.stringify( out, null, 4 ) );

} )();
