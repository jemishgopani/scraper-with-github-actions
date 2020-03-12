const puppeteer = require("puppeteer");

class Browser {
	async init() {
		return await puppeteer.launch({headless: false});
	}
}

module.exports = Browser;