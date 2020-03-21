class Page {
  constructor () {
    this.browser = null
    this.page = null
  }

  async init (browser) {
    this.browser = await browser
    this.page = await this.newPage()
    return this.page
  }

  async goto (url) {
    await this.page.goto(url, { waitUntil: 'networkidle', timeout: 60 })
  }

  async newPage () {
    const page = await this.browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setDefaultNavigationTimeout(0);
    return page
  }
}

module.exports = Page
