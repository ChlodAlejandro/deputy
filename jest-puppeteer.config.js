module.exports = {
	launch: {
		headless: process.env.CI != null || process.env.HEADLESS !== '0'
	}
};
