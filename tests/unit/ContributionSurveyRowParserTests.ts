import ContributionSurveyRowParser from '../../src/models/ContributionSurveyRowParser';

describe( 'ContributionSurveyRowParser tests', () => {

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
