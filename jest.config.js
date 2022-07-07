/** @type {import("@jest/types").Config.InitialOptions} */
module.exports = {

	preset: 'jest-puppeteer',
	testRegex: '(/tests/)(.*?)(Tests?)(\\.[jt]s)$',

	transform: {
		'^.+\\.ts?$': 'ts-jest'
	},
	globals: {
		'ts-jest': {
			tsconfig: '<rootDir>/tsconfig.tests.json'
		}
	},
	setupFiles: [ './tests/setup.ts' ]

};
