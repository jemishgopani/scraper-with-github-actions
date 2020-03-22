const fs = require('fs').promises
const Browser = require('../utils/browser')
const Page = require('../utils/page')

// Custom modules
const locators = require('../locators/boatsonline')
const loader = require('../utils/load')

// Local constants
const URL = 'https://www.boatsonline.com.au/boats/dealers.html'
const jsonResultFile = 'collected_data/json/boatsonline.json'
const csvResultFile = 'collected_data/csv/boatsonline.csv'
const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9._-]+)/gi
const BoatsOnline = {
  browser: null,
  page: null,
  finalResult: [],

  // This method for trigger "BoatsOnline" scraper.
  start: async () => {
    // Custom console outputs.
    console.log('--------------------------------- Boats Online --------------------------------------')
    loader.console('Process has been started.')

    // Create a new browser window.
    BoatsOnline.browser = await new Browser().init()

    // Open "New Tab" on browser.
    BoatsOnline.page = await new Page().init(BoatsOnline.browser)

    // Open url on "New Tab"
    await BoatsOnline.page.goto(URL)

    // Getting boat dealer results.
    await BoatsOnline.parseResults()

    // Removing duplicate emails
//    await BoatsOnline.removeDuplicates()

    // Build CSV and JSON outputs
    await BoatsOnline.buildJsonOutput(BoatsOnline.finalResult, jsonResultFile)
    await BoatsOnline.buildCsvOutput(BoatsOnline.finalResult, csvResultFile)
    await loader.success(`Saved ${BoatsOnline.finalResult.length} records of Dealers.`)
    await BoatsOnline.browser.close()
  },

  parseDealerLinks: async () => {
    await BoatsOnline.page.waitForSelector(locators.DEALERS.LIST_CONTAINER)
    const dealersStateContainer = await BoatsOnline.page.$(locators.DEALERS.LIST_CONTAINER)
    const dealerTabs = await dealersStateContainer.$$(locators.DEALERS.DEALER_TAB)
    const linksData = []
    let dealerName = ''
    for (const dealer of dealerTabs) {
      const stateId = await dealer.evaluate((el) => {
        return el.hash
      })
      await dealer.click()
      const rows = await dealersStateContainer.$$(locators.DEALERS.DEALERS_ROW(stateId))
      for (const row of rows) {
        let link = await row.$(locators.DEALERS.DEALER_LINK)
        if (link != null) {
          dealerName = await link.evaluate(el => el.innerText)
          link = await link.evaluate((el) => {
            return el.href
          })
          let adsCount = await row.$(locators.DEALERS.DEALER_LISTING)
          adsCount = await adsCount.evaluate(el => el.innerText.replace(/\(|\)/g, ''))
          linksData.push({
            link: link,
            ads: adsCount,
            dealer: dealerName
          })
        }
      }
    }
    return linksData
  },

  parseResults: async () => {
    let email, phone, dealerAddress
    const dealerData = await BoatsOnline.parseDealerLinks()
    for (const data of dealerData) {
      try {
        await BoatsOnline.page.goto(data.link)
        dealerAddress = await BoatsOnline.page.$(locators.DEALERS.DEALER_ADDRESS)
        dealerAddress = await dealerAddress.evaluate(el => el.innerText)
        phone = await BoatsOnline.page.$(locators.DEALERS.DEALER_PHONE)
        phone = await phone.evaluate(el => el.innerText)
        const url = await BoatsOnline.page.$(locators.DEALERS.DEALER_WEBSITE)
        const website = await url.evaluate(el => {
          return el.href
        })
        email = ''
        if (data.ads >= 20) {
          await BoatsOnline.page.goto(website)
          let pageContext = await BoatsOnline.page.evaluate(() => document.body.innerText)
          email = await pageContext.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
          if (email == null) {
            let contact = await BoatsOnline.page.$$('a[href*=contact]')
            if (contact[0] !== undefined) {
              contact = await contact[0].evaluate(el => el.href)
              await BoatsOnline.page.goto(contact)
              await BoatsOnline.page.waitForSelector('body')
              pageContext = await BoatsOnline.page.$('body')
              email = await pageContext.evaluate(el => {
                const mail = el.innerText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)
                return mail
              })
            }
          }
        }
        BoatsOnline.finalResult.push({
          name: data.dealer,
          phoneNumber: phone,
          address: dealerAddress,
          website: website,
          email: email,
          ads: data.ads
        })
      } catch (e) {
        console.log(e)
      }
      if(BoatsOnline.finalResult.length > 10) break
    }
    await loader.success('Dealer information such as name, email, phone, fax, website and address collected.')
  },

  removeDuplicates: async () => {
    for (let index = 0; index < BoatsOnline.finalResult.length; index++) {
      const x = {}
      for (const email of BoatsOnline.finalResult[index].email) {
        if (!x[email]) {
          x[email] = true
        }
      }
      BoatsOnline.finalResult[index].email = Object.keys(x)
    }
  },

  buildJsonOutput: async (data, resultFile) => {
    await fs.writeFile(resultFile, JSON.stringify(data, null, 4))
  },

  buildCsvOutput: async (data, resultFile) => {
    await fs.writeFile(resultFile, 'Name, Email, Phone Number, Website, Address, Advertisements\n')
    for (const row of data) {
      await fs.appendFile(resultFile, `"${row.name}", "${row.email}", "${row.phoneNumber}", "${row.website}", "${row.address}", "${row.ads}"\n`)
    }
  }
}

module.exports = BoatsOnline
