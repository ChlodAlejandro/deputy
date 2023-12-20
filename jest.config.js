/** @type {import("@jest/types").Config.InitialOptions} */
module.exports = {

	testRegex: '(/tests/)(.*?)(Tests?)(\\.[jt]s)$',

	transform: {
		'^.+\\.tsx?$': [ 'ts-jest', {
			tsconfig: '<rootDir>/tsconfig.tests.json'
		} ]
	},
	testTimeout: 600e3

};
