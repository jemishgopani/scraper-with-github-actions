const fs = require('fs').promises
const Browser = require('../utils/browser')
const Page = require('../utils/page')

// Custom modules
const locators = require('../locators/theyachtmarket')
// const loader = require('../utils/load')

// Local constants
const URL = 'https://www.theyachtmarket.com/en/brokers/'
const jsonResultFile = 'collected_data/json/theyachtmarket.json'
const csvResultFile = 'collected_data/csv/theyachtmarket.csv'
const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9._-]+)/gi
const TheYachtMarket = {
    browser: null,
    page: null,
    finalResult: [],

    // This method for trigger "TheYachtMarket" scraper.
    start: async () => {
        // Custom console outputs.
        console.log('--------------------------------- The Yacht Market --------------------------------------')
        // loader.console('Process has been started.')

        // Create a new browser window.
        TheYachtMarket.browser = await new Browser().init()

        // Open "New Tab" on browser.
        TheYachtMarket.page = await new Page().init(TheYachtMarket.browser)

        // Open url on "New Tab"
        await TheYachtMarket.page.goto(URL)

        // Getting boat dealer results.
        await TheYachtMarket.parseResults()
        //
        // Build CSV and JSON outputs
        await TheYachtMarket.buildJsonOutput(TheYachtMarket.finalResult, jsonResultFile)
        console.log(TheYachtMarket.finalResult.length+"Saved")
        // await TheYachtMarket.buildCsvOutput(TheYachtMarket.finalResult, csvResultFile)
        // await loader.success(`Saved ${TheYachtMarket.finalResult.length} records of Dealers.`)
        await TheYachtMarket.browser.close()
    },

    parseCountryLinks: async () => {
        const countries = []
        const countryLinks = await TheYachtMarket.page.$$(locators.COUNTRY_LINK);
        for(let country of countryLinks){
            let countryName = await country.evaluate( el => el.innerText)
            let countryLink = await country.evaluate( el => el.href)
            countries.push({
                name: countryName,
                link: countryLink,
            })
        }
        return countries
    },

    parseDealerLinks: async () => {
        const dealersPageList = []
        const countries = await TheYachtMarket.parseCountryLinks()
        for(let country of countries){
            await TheYachtMarket.page.goto(country.link)
            const paginationLinks = []
            let dealersListPage = await TheYachtMarket.page.$$(locators.PAGINATION_LINK)
            for(let dealersPage of dealersListPage){
                dealersPage = await dealersPage.evaluate(el => el.href)
                paginationLinks.push(dealersPage)
            }
            const dealerPagesLinks = []
            for(let page of paginationLinks){
                await TheYachtMarket.page.goto(page)
                const dealerPageLinks = await TheYachtMarket.page.$$(locators.DEALER_PAGE_LINK)
                for(let dealerPageLink of dealerPageLinks){
                    let dealerLink = await dealerPageLink.evaluate(el => el.href)
                    let dealerName = await dealerPageLink.evaluate(el => el.innerText)
                    dealerPagesLinks.push({
                        name: dealerName,
                        link: dealerLink
                    })
                }
            }
            dealersPageList.push({
                country: country.name,
                dealers: dealerPagesLinks
            })
            // if(dealersPageList.length > 0) break
        }
        return dealersPageList
    },

    parseResults: async () => {
        const dealersPages = await TheYachtMarket.parseDealerLinks();
        try {
            for (let dealerData of dealersPages) {
                for (let dealers of dealerData.dealers) {
                    await TheYachtMarket.page.goto(dealers.link)
                    let revealMobileButton = await TheYachtMarket.page.$(locators.DEALER.REVEAL_MOBILE_NUMBER_BUTTON)
                    if (revealMobileButton !== null) {
                        await revealMobileButton.click()
                        await TheYachtMarket.page.waitFor(500)
                    }
                    let dealerAddress = await TheYachtMarket.page.$(locators.DEALER.ADDRESS.ADDRESS_TEXT)
                    if(dealerAddress !== null) dealerAddress = await dealerAddress.evaluate(el => el.innerText)
                    let dealerMobileNumber = await TheYachtMarket.page.$(locators.DEALER.MOBILE_NUMBER_TEXT)
                    dealerMobileNumber = await dealerMobileNumber.evaluate(el => el.innerText)
                    let dealerWebsite = await TheYachtMarket.page.$(locators.DEALER.WEBSITE_LINK)
                    if (dealerWebsite !== null) dealerWebsite = await dealerWebsite.evaluate(el => el.href)
                    let street = await TheYachtMarket.page.$(locators.DEALER.ADDRESS.STREET_TEXT)
                    if (street !== null) street = await street.evaluate(el => el.innerText)
                    let region = await TheYachtMarket.page.$(locators.DEALER.ADDRESS.REGION_TEXT)
                    if (region !== null) region = await region.evaluate(el => el.innerText)
                    let postalCode = await TheYachtMarket.page.$(locators.DEALER.ADDRESS.POSTAL_CODE_TEXT)
                    if (postalCode !== null) postalCode = await postalCode.evaluate(el => el.innerText)
                    let country = await TheYachtMarket.page.$(locators.DEALER.ADDRESS.COUNTRY_NAME_TEXT)
                    if (country !== null) country = await country.evaluate(el => el.innerText)
                    let boatsFromThisBrokerLink = await TheYachtMarket.page.$(locators.DEALER.BOATS_FROM_BROKER_BUTTON)
                    let adsCount = 0
                    if(boatsFromThisBrokerLink !== null) {
                        boatsFromThisBrokerLink = await boatsFromThisBrokerLink.evaluate(el => el.href)
                        await TheYachtMarket.page.goto(boatsFromThisBrokerLink)
                        adsCount = await TheYachtMarket.page.$x(locators.DEALER.DEALER_ADS_COUNT_TEXT)
                        if (adsCount !== null) adsCount = await TheYachtMarket.page.evaluate(el => {
                            const text = (el !== undefined) ? el.textContent : ''
                            return (text !== '') ? text.substring(text.lastIndexOf('(') + 1, text.lastIndexOf('boats')).replace(/\s/, '') : ''
                        }, adsCount[0])
                    }
                    TheYachtMarket.finalResult.push({
                        name: dealers.name,
                        address: {
                            fullAddress: dealerAddress,
                            street: street,
                            region: region,
                            postalCode: postalCode,
                            country: country,
                            ads: adsCount
                        },
                        phone: dealerMobileNumber,
                        website: dealerWebsite
                    })
                }
            }
        }catch (e) {
            console.log(e)
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

module.exports = TheYachtMarket
