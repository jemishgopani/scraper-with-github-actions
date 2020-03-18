const puppeteer = require('puppeteer')

class Browser {
  async init () {
    return puppeteer.launch({ headless: true })
  }
}

module.exports = Browser
