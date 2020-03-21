const puppeteer = require('puppeteer')

class Browser {
  async init () {
    return puppeteer.launch({ headless: true, args: ['--start-maximized'] })
  }
}

module.exports = Browser
