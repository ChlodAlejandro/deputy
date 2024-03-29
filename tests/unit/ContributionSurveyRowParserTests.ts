import ContributionSurveyRowParser from '../../src/models/ContributionSurveyRowParser';

describe( 'ContributionSurveyRowParser string work tests', () => {

	test( 'getCurrentLength', () => {
		const parser = new ContributionSurveyRowParser( 'abc' );
		expect( parser.getCurrentLength() ).toBe( 3 );
	} );

	test( 'peek', () => {
		const parser = new ContributionSurveyRowParser( 'abc' );
		expect( parser.getCurrentLength() ).toBe( 3 );
		expect( parser.peek() ).toBe( 'a' );
	} );

	test( 'eat', () => {
		const parser = new ContributionSurveyRowParser( 'abc' );
		expect( parser.getCurrentLength() ).toBe( 3 );
		expect( parser.eat() ).toBe( 'a' );
		expect( parser.peek() ).toBe( 'b' );
		expect( parser.getCurrentLength() ).toBe( 2 );
	} );

	test( 'eatUntil (string)', () => {
		const parser = new ContributionSurveyRowParser( 'abcdef' );
		expect( parser.getCurrentLength() ).toBe( 6 );
		expect( parser.eatUntil( 'c' ) ).toBe( 'ab' );
		expect( parser.getCurrentLength() ).toBe( 4 );
	} );

	test( 'eatUntil (RegExp)', () => {
		// Expect nothing consumed here since the match is global.
		const parser1 = new ContributionSurveyRowParser( 'abcdef' );
		expect( parser1.getCurrentLength() ).toBe( 6 );
		expect( parser1.eatUntil( /cd/g ) ).toBe( '' );
		expect( parser1.getCurrentLength() ).toBe( 6 );

		const parser2 = new ContributionSurveyRowParser( 'abcdef' );
		expect( parser2.getCurrentLength() ).toBe( 6 );
		expect( parser2.eatUntil( /^([cd])/g ) ).toBe( 'ab' );
		expect( parser2.getCurrentLength() ).toBe( 4 );

		const parser3 = new ContributionSurveyRowParser( 'abcdef' );
		expect( parser3.getCurrentLength() ).toBe( 6 );
		expect( parser3.eatUntil( /^([ef])/g ) ).toBe( 'abcd' );
		expect( parser3.getCurrentLength() ).toBe( 2 );
	} );

	test( 'eatUntil (noFinish)', () => {
		const parser1 = new ContributionSurveyRowParser( 'abcdef' );
		expect( parser1.getCurrentLength() ).toBe( 6 );
		expect( parser1.eatUntil( 'k' ) ).toBe( 'abcdef' );
		expect( parser1.getCurrentLength() ).toBe( 0 );

		const parser2 = new ContributionSurveyRowParser( 'abcdef' );
		expect( parser2.getCurrentLength() ).toBe( 6 );
		expect( parser2.eatUntil( 'k', true ) ).toBe( null );
		expect( parser2.getCurrentLength() ).toBe( 6 );
	} );

	test( 'eatExpression', () => {
		const parser = new ContributionSurveyRowParser( 'abcdef' );
		expect( parser.getCurrentLength() ).toBe( 6 );
		expect( parser.eatExpression( /[abc]+/ ) ).toBe( 'abc' );
		expect( parser.peek() ).toBe( 'd' );
		expect( parser.getCurrentLength() ).toBe( 3 );
	} );

} );

describe( 'ContributionSurveyRowParser line parsing tests', () => {

	test( 'normal, short', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]] (1 edit): [[Special:Diff/123456|(+173)]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ' (1 edit): ',
			diffs: '[[Special:Diff/123456|(+173)]]',
			comments: null,
			revids: [ 123456 ],
			revidText: {
				123456: '+173'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'normal, long', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]] (1 edit, 1 major, +173): [[Special:Diff/123456|(+173)]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ' (1 edit, 1 major, +173): ',
			diffs: '[[Special:Diff/123456|(+173)]]',
			comments: null,
			revids: [ 123456 ],
			revidText: {
				123456: '+173'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'normal, long, multiple diffs', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]] (1 edit, 1 major, +173): [[Special:Diff/123456|(+173)]]' +
			'[[Special:Diff/7890|(+22)]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ' (1 edit, 1 major, +173): ',
			diffs: '[[Special:Diff/123456|(+173)]][[Special:Diff/7890|(+22)]]',
			comments: null,
			revids: [ 123456, 7890 ],
			revidText: {
				123456: '+173',
				7890: '+22'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'normal, short, pre-colon', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]]: (1 edit) [[Special:Diff/123456|(+173)]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ': (1 edit) ',
			diffs: '[[Special:Diff/123456|(+173)]]',
			comments: null,
			revids: [ 123456 ],
			revidText: {
				123456: '+173'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'normal, long, pre-colon', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]]: (1 edit, 1 major, +173) [[Special:Diff/123456|(+173)]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ': (1 edit, 1 major, +173) ',
			diffs: '[[Special:Diff/123456|(+173)]]',
			comments: null,
			revids: [ 123456 ],
			revidText: {
				123456: '+173'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'finished, pre-colon', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]]: {{?}} Deleted'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ': ',
			diffs: null,
			comments: '{{?}} Deleted',
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'creation, short', () => {
		const parser = new ContributionSurveyRowParser(
			'* \'\'\'N\'\'\' [[:Example]] (1 edit): [[Special:Diff/123456|(+173)]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: true,
			page: ':Example',
			extras: ' (1 edit): ',
			diffs: '[[Special:Diff/123456|(+173)]]',
			comments: null,
			revids: [ 123456 ],
			revidText: {
				123456: '+173'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'creation, long', () => {
		const parser = new ContributionSurveyRowParser(
			'* \'\'\'N\'\'\' [[:Example]] (1 edit, 1 major, +173): [[Special:Diff/123456|(+173)]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: true,
			page: ':Example',
			extras: ' (1 edit, 1 major, +173): ',
			diffs: '[[Special:Diff/123456|(+173)]]',
			comments: null,
			revids: [ 123456 ],
			revidText: {
				123456: '+173'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'finished, has comment', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]]: {{y}} <span style="background:#ffff55">\'\'\'\'\'[[User:' +
			'Chlod|Chlod]]\'\'\'\'\'</span>&nbsp;<small style="font-size:calc(1em - 2pt)">' +
			'([[#top|top]]&nbsp;•&nbsp;[[Special:Contributions/Chlod|contribs]])</small> ' +
			'16:22, 28 June 2022 (UTC)'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ': ',
			diffs: null,
			comments: '{{y}} <span style="background:#ffff55">\'\'\'\'\'[[User:Chlod|' +
				'Chlod]]\'\'\'\'\'</span>&nbsp;<small style="font-size:calc(1em - 2pt)">' +
				'([[#top|top]]&nbsp;•&nbsp;[[Special:Contributions/Chlod|contribs]])</small> ' +
				'16:22, 28 June 2022 (UTC)',
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( '{{dif}}, pre-colon', () => {
		// Dawkeye
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]]: (1 edits, 1 major, +15927) \'\'\'{{dif|340829968|(+15927)}}\'\'\''
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ': (1 edits, 1 major, +15927) ',
			diffs: '\'\'\'{{dif|340829968|(+15927)}}\'\'\'',
			comments: null,
			revids: [ 340829968 ],
			revidText: {
				340829968: '+15927'
			},
			diffTemplate: '{{dif|$1|($2)}}',
			diffsTemplate: "'''$1'''"
		} );
	} );

	test( 'file link', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:File:Example.png]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'pageonly',
			bullet: '* ',
			creation: false,
			page: ':File:Example.png',
			extras: null,
			diffs: null,
			comments: null,
			revids: [ ],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: pre-colon, no comment, no diffs', () => {
		const parser = new ContributionSurveyRowParser(
			'*[[:Example]]: (1 edit)'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '*',
			creation: false,
			page: ':Example',
			extras: ': (1 edit)',
			diffs: null,
			comments: null,
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: missing extras colon', () => {
		const parser = new ContributionSurveyRowParser(
			'*[[:Example]] (1 edit, 1 major, +173)'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '*',
			creation: false,
			page: ':Example',
			extras: ' (1 edit, 1 major, +173)',
			diffs: null,
			comments: null,
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: missing extras colon', () => {
		const parser = new ContributionSurveyRowParser(
			'*[[:Example]] (1 edit, 1 major, +173) {{n}}'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '*',
			creation: false,
			page: ':Example',
			extras: ' (1 edit, 1 major, +173) ',
			diffs: null,
			comments: '{{n}}',
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: no extras', () => {
		const parser = new ContributionSurveyRowParser(
			'*[[:Example]] {{?}}'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '*',
			creation: false,
			page: ':Example',
			extras: ' ',
			diffs: null,
			comments: '{{?}}',
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: odd comment', () => {
		const parser = new ContributionSurveyRowParser(
			'*[[:Example]] {{done}} with {{y}}'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '*',
			creation: false,
			page: ':Example',
			extras: ' ',
			diffs: null,
			comments: '{{done}} with {{y}}',
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: spaceless comment', () => {
		const parser = new ContributionSurveyRowParser(
			'*[[:Example]]{{x}}'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '*',
			creation: false,
			page: ':Example',
			extras: null,
			diffs: null,
			comments: '{{x}}',
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: comment after diffs (unfinished, has comment)', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]]: (1 edit, 1 major, +173) [[Special:Diff/123456|(+173)]] muy bien'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ': (1 edit, 1 major, +173) ',
			diffs: '[[Special:Diff/123456|(+173)]]',
			comments: ' muy bien',
			revids: [ 123456 ],
			revidText: {
				123456: '+173'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: page only, no diffs', () => {
		const parser = new ContributionSurveyRowParser(
			// WikiProject Tropical cyclones
			'*[[:1852 Atlantic hurricane season]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'pageonly',
			bullet: '*',
			creation: false,
			page: ':1852 Atlantic hurricane season',
			extras: null,
			diffs: null,
			comments: null,
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: interwiki link only', () => {
		const parser = new ContributionSurveyRowParser(
			// 20110727 11
			'*[[:c:File:Corrected Pueblo County, CO, Courthouse IMG 5089.JPG]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'pageonly',
			bullet: '*',
			creation: false,
			page: ':c:File:Corrected Pueblo County, CO, Courthouse IMG 5089.JPG',
			extras: null,
			diffs: null,
			comments: null,
			revids: [],
			revidText: {},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: multiple diffs with spaces', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]] (1 edit, 1 major, +173): [[Special:Diff/123456|(+173)]] ' +
			'[[Special:Diff/7890|(+22)]]'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ' (1 edit, 1 major, +173): ',
			diffs: '[[Special:Diff/123456|(+173)]] [[Special:Diff/7890|(+22)]]',
			comments: null,
			revids: [ 123456, 7890 ],
			revidText: {
				123456: '+173',
				7890: '+22'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'edge: multiple diffs with spaces, comment', () => {
		const parser = new ContributionSurveyRowParser(
			'* [[:Example]] (1 edit, 1 major, +173): [[Special:Diff/123456|(+173)]] ' +
			'[[Special:Diff/7890|(+22)]] extra comment here for some reason'
		);
		expect( parser.parse() ).toEqual( {
			type: 'detailed',
			bullet: '* ',
			creation: false,
			page: ':Example',
			extras: ' (1 edit, 1 major, +173): ',
			diffs: '[[Special:Diff/123456|(+173)]] [[Special:Diff/7890|(+22)]]',
			comments: ' extra comment here for some reason',
			revids: [ 123456, 7890 ],
			revidText: {
				123456: '+173',
				7890: '+22'
			},
			diffTemplate: '[[Special:Diff/$1|($2)]]',
			diffsTemplate: '$1'
		} );
	} );

	test( 'fail: missing bullet', () => {
		const parser = new ContributionSurveyRowParser(
			'[[:1852 Atlantic hurricane season]]'
		);
		expect( () => {
			parser.parse();
		} ).toThrowError(
			'dp-malformed-row'
		);
	} );

	test( 'fail: collapse bottom', () => {
		const parser = new ContributionSurveyRowParser(
			'{{collapse bottom}}'
		);
		expect( () => {
			parser.parse();
		} ).toThrowError(
			'dp-malformed-row'
		);
	} );

	test( 'fail: fake heading', () => {
		const parser = new ContributionSurveyRowParser(
			'<div class="testHeading1"></div>'
		);
		expect( () => {
			parser.parse();
		} ).toThrowError(
			'dp-malformed-row'
		);
	} );

} );
