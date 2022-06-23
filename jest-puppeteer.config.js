module.exports = {
	launch: {
		headless: process.env.CI != null || process.env.HEADLESS !== '0',
		product: process.env.PUPPETEER_PRODUCT || 'chrome'
	}
};
