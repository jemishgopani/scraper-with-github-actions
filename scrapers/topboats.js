const fs = require('fs').promises
const Browser = require('../utils/browser')
const Page = require('../utils/page')
const request = require('sync-request')
const queryString = require('querystring')
// Custom modules
const locators = require('../locators/topboats')
const loader = require('../utils/load')

// Local constants
const URL = 'https://uk.topboats.com/yachting/nautical-business-directory?categoria=embarcaciones&country=all'
const jsonResultFile = 'collected_data/json/topboats.json'
const csvResultFile = 'collected_data/csv/topboats.csv'
const TopBoats = {
    browser: null,
    page: null,
    finalResult: [],
    webPhoneData: [],

    // This method for trigger "TopBoats" scraper.
    start: async () => {
        // Custom console outputs.
        console.log('--------------------------------- The Yacht Market --------------------------------------')
        loader.console('Process has been started.')

        // Create a new browser window.
        TopBoats.browser = await new Browser().init()

        // Open "New Tab" on browser.
        TopBoats.page = await new Page().init(TopBoats.browser)

        // Open url on "New Tab"
        await TopBoats.page.goto(URL)

        // Getting boat dealer results.
        await TopBoats.parseResults()
        await loader.success('Dealer information such as name, email, phone, fax, website and address collected.')

        await TopBoats.processingOnData()

        // console.log(TopBoats.finalResult)

        // get emails form dealer's websites
        // await TopBoats.getEmailsFromWebsite()

        // Build CSV and JSON outputs
        await TopBoats.buildJsonOutput(TopBoats.finalResult, jsonResultFile)
        await TopBoats.buildCsvOutput(TopBoats.finalResult, csvResultFile)
        await loader.success(`Saved ${TopBoats.finalResult.length} records of Dealers.`)
        await TopBoats.browser.close()
    },

    parseDealerLinks: async () => {
        const dealerLinks = []
        let totalResults = await TopBoats.page.$(locators.DEALER_TOTAL_RESULTS_TEXT)
        totalResults = await totalResults.evaluate(el => {
            let text = el.innerText
            return text.substring(text.lastIndexOf('Showing') + 8, text.lastIndexOf('companies')).replace(/\s/, '')
        })
        do {
            await TopBoats.page.waitForSelector(locators.DEALER_PAGE_LINK)
            const links = await TopBoats.page.$$(locators.DEALER_PAGE_LINK)
            // console.log('count ---> '+links.length)
            for(let link of links){
                let name = await link.evaluate(el => el.innerText)
                // console.log(name)
                link = await link.evaluate(el => el.href)
                dealerLinks.push({
                    link: link,
                    name: name
                })
            }
           const nextButton = await TopBoats.page.$(locators.DEALER_PAGINATION_NEXT_BUTTON_LINK)
            if(nextButton !== null)  await nextButton.click()
        }while(dealerLinks.length < 20)
        console.log(dealerLinks.length)
        // console.log(dealerLinks)
        return dealerLinks
    },

    parseResults: async () => {
        const dealers = await TopBoats.parseDealerLinks()
        for(let dealer of dealers){
            await TopBoats.page.goto(dealer.link)
            let flag = false
            let address = await TopBoats.page.$(locators.DEALER.ADDRESS_TEXT)
            if(address !== null) address = await address.evaluate(el => el.innerText)

            let uid = await TopBoats.page.$(locators.DEALER.UID)
            if(uid !== null) uid = await uid.evaluate(el => el.value)



            do {
                try {
                    flag = false
                    await TopBoats.page.waitForSelector('body')
                    let newBoats = await TopBoats.page.$x(locators.DEALER.NEW_LINK)
                    newBoats = await TopBoats.page.evaluate(el => {
                        const text = (el !== undefined) ? el.textContent : ''
                        return (text !== '') ? text.substring(text.lastIndexOf('New (') + 5, text.lastIndexOf(')')).replace(/\s/g, '') : ''
                    }, newBoats[0])
                    let usedBoats = await TopBoats.page.$x(locators.DEALER.USED_BOATS_LINK)
                    usedBoats = await TopBoats.page.evaluate(el => {
                        const text = (el !== undefined) ? el.textContent : ''
                        return (text !== '') ? text.substring(text.lastIndexOf('Used boats (') + 12, text.lastIndexOf(')')).replace(/\s/g, '') : ''
                    }, usedBoats[0])
                    let charterBoats = await TopBoats.page.$x(locators.DEALER.CHARTER_LINK)
                    charterBoats = await TopBoats.page.evaluate(el => {
                        const text = (el !== undefined) ? el.textContent : ''
                        return (text !== '') ? text.substring(text.lastIndexOf('Charter (') + 9, text.lastIndexOf(')')).replace(/\s/g, '') : ''
                    }, charterBoats[0])
                    let moorings = await TopBoats.page.$x(locators.DEALER.MOORINGS_LINK)
                    moorings = await TopBoats.page.evaluate(el => {
                        const text = (el !== undefined) ? el.textContent : ''
                        return (text !== '') ? text.substring(text.lastIndexOf('Moorings (') + 10, text.lastIndexOf(')')).replace(/\s/g, '') : ''
                    }, moorings[0])
                    if (newBoats.length !== 0 || charterBoats.length !== 0 || usedBoats.length !== 0 && moorings.length !== 0) {
                        flag = false
                        TopBoats.finalResult.push({
                            uid: uid,
                            name: dealer.name,
                            address: address,
                            phoneNumber: '',
                            website: '',
                            newBoats: Number(newBoats),
                            usedBoats: Number(usedBoats),
                            charterBoats: Number(charterBoats),
                            ads: '',
                            moorings: Number(moorings)
                        })
                    } else {
                        const [allAdsButton] = await TopBoats.page.$x(locators.DEALER.LOOK_AT_ALL_ADS_LINK)
                        if (allAdsButton != null) {
                            await allAdsButton.click()
                            flag = true
                        } else {
                            flag = false
                        }
                    }
                }catch (e) {
                    console.log(e.message)
                }
            }while(flag === true)
        }
    },

    processingOnData: async  () => {
        await TopBoats.findPhoneAndWebsite()
    },

    findPhoneAndWebsite: async () => {
        const websitePattern = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g
        for(let i = 0; i < TopBoats.finalResult.length; i++) {
            const phoneResponse = request('POST', 'https://uk.topboats.com/muestraOcultosEmpresa', {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: queryString.stringify({uid: TopBoats.finalResult[i].uid, atributo: 'telefono'})
            })
            const websiteResponse = request('POST', 'https://uk.topboats.com/muestraOcultosEmpresa', {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                },
                body: queryString.stringify({uid: TopBoats.finalResult[i].uid, atributo: 'web'})
            })

            let phone = phoneResponse.getBody().toString().replace(/\s/g, '')
            let website = websiteResponse.getBody().toString().match(websitePattern)
            TopBoats.finalResult[i].phoneNumber = phone
            TopBoats.finalResult[i].website = website[0]
            let totalBoats = (TopBoats.finalResult[i].newBoats + TopBoats.finalResult[i].charterBoats + TopBoats.finalResult[i].usedBoats)
            TopBoats.finalResult[i].ads = totalBoats
        }
    },

    buildJsonOutput: async (data, resultFile) => {
        await fs.writeFile(resultFile, JSON.stringify(data, null, 4))
    },

    buildCsvOutput: async (data, resultFile) => {
        await fs.writeFile(resultFile, 'Name, Phone Number, Website, Address, New Boats, Used Boats, Charter Boats, Moorings, Advertisements\n')
        for (const row of data) {
            await fs.appendFile(resultFile, `"${row.name}", "${row.phoneNumber}", "${row.website}", "${row.address}", "${row.newBoats}", "${row.usedBoats}", "${row.charterBoats}", "${row.moorings}", "${row.ads}"\n`)
        }
    }
}

module.exports = TopBoats
