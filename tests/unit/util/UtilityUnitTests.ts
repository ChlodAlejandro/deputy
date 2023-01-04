import pickSequence from '../../../src/util/pickSequence';

describe( 'Utility function tests', () => {

	test( 'pickSequence', async () => {
		expect( Array.from(
			pickSequence(
				[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
				( v ) => v % 3 === 0
			)
		) ).toStrictEqual(
			[
				[ 3, 4, 5 ],
				[ 6, 7, 8 ],
				[ 9, 10 ]
			]
		);
	} );

	test( 'pickSequence', async () => {
		expect( Array.from(
			pickSequence(
				[ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ],
				( v ) => v % 2 === 0
			)
		) ).toStrictEqual(
			[
				[ 2, 3 ], [ 4, 5 ], [ 6, 7 ],
				[ 8, 9 ], [ 10 ]
			]
		);
	} );

	test( 'pickSequence', async () => {
		expect( Array.from(
			pickSequence(
				[
					'* line 1',
					'* line 2',
					'*: comment for line 2',
					'* line 3',
					'* line 4'
				],
				( v ) => /\*[^:*#]/.test( v )
			)
		) ).toStrictEqual(
			[
				[ '* line 1' ],
				[ '* line 2', '*: comment for line 2' ],
				[ '* line 3' ],
				[ '* line 4' ]
			]
		);
	} );

} );
