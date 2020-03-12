const fs = require("fs");
const Browser = require("../utils/browser");
const Page = require("../utils/page");

// Custom modules
const locators = require("../locators/boats24");
const dataProcess = require("../utils/dataProcess");
const loader = require("../utils/load");

// Local constants
const URL = "https://www.boats24.com/boatdealer";
const trainingDataPath = "training_data";
const jsonResultFile = "collected_data/json/boats24.json";
const csvResultFile = "collected_data/csv/boats24.csv";

const Boats24 = {
	browser: null,
	page: null,

	// This method for trigger "Boats24" scraper.
	start: async () => {
		// Custom console outputs.
		loader.console("Process has been started.");

		// Create a new browser window.
		Boats24.browser = await new Browser().init();

		// Open "New Tab" on browser.
		Boats24.page = await new Page().init(Boats24.browser);

		// Open url on "New Tab"
		await Boats24.page.goto(URL);

		// Filtering boat dealers data on browser.
		await Boats24.filterBoatData();

		// Getting boat dealer results.
		await Boats24.parseResults();
	},

	filterBoatData: async () => {
		const filterBoatsContainer = await Boats24.page.$(locators.FILTER.CONTAINER);
		const countrySelect = await filterBoatsContainer.$(locators.FILTER.COUNTRY_SELECT);
		const boatTypesSelect = await filterBoatsContainer.$(locators.FILTER.BOAT_TYPES);
		const searchButton = await filterBoatsContainer.$(locators.FILTER.SUBMIT_BUTTON);
		await countrySelect.evaluate( (el) => {
			el.value = "";
		});
		await boatTypesSelect.evaluate( (el) => {
			el.value = "";
		});
		await searchButton.click();
	},

	parseResults: async () => {
		const data = [];
		// Getting dealer's profile links
		const links = await Boats24.parseDealerAdLinks();
		for (const link of links) {
			await Boats24.page.goto(link);
			const dealerContainer = await Boats24.page.$(locators.DEALER_DETAILS.CONTAINER);
			let dealerName = await dealerContainer.$(locators.DEALER_DETAILS.NAME_TEXT);
			dealerName = await dealerName.evaluate((el) => {
				return el.innerText;
			});

			let faxNumber = await dealerContainer.$x(locators.DEALER_DETAILS.FAX_TEXT);
			faxNumber = await Boats24.page.evaluate((el) => (el !== undefined)? el.textContent : "", faxNumber[0]);

			let phoneNumber = await dealerContainer.$x(locators.DEALER_DETAILS.PHONE_TEXT);
			phoneNumber = await Boats24.page.evaluate((el) => (el !== undefined)? el.textContent : "", phoneNumber[0]);

			let website = await dealerContainer.$(locators.DEALER_DETAILS.WEBSITE_LINK);
			website = await (website !== null)?await website.evaluate((el) => {
				return (el !== undefined)? el.href : "";
			}) : "";

			let address = await dealerContainer.$(locators.DEALER_DETAILS.ADDRESS_TEXT);
			address = await (address !== null)?await address.evaluate((el) => {
				return (el !== undefined)? el.innerText.replace("Show Map", ""): "";
			}) : "";

			await Boats24.page.waitForSelector(locators.DEALER_DETAILS.EMAIL_IMAGE);
			let dealerEmail = await dealerContainer.$(locators.DEALER_DETAILS.EMAIL_IMAGE);
			dealerEmail = await dealerEmail.evaluate((el) => {
				return el.src;
			});
			data.push({
				name: dealerName,
				email: dealerEmail,
				faxNumber: faxNumber,
				phoneNumber: phoneNumber,
				website: website,
				address: address
			});
		}
		await loader.success("Dealer information such as name, email, phone, fax, website and address collected.");

		// Processing on data (Extracting emails from images)
		await dataProcess.init(data, trainingDataPath);
		await dataProcess.processOnData();

		// Save data on .csv file.
		await Boats24.buildJsonOutput(dataProcess.data, jsonResultFile);
		await Boats24.buildCsvOutput(dataProcess.data, csvResultFile);
		await Boats24.browser.close();
		await loader.success(`Saved ${dataProcess.data.length} records of Dealers.`);
	},

	parseDealerAdLinks: async () => {
		const links = [];
		await Boats24.page.waitForSelector(locators.TOTAL_RESULTS_NAV_LINK);
		let totalResult = await Boats24.page.$(locators.TOTAL_RESULTS_NAV_LINK);
		totalResult = await totalResult.evaluate((el) => {
			return el.innerText.match(/\d[0-9]./g).toString();
		});
		let i=1;
		do {
			await Boats24.page.waitForSelector(locators.NEXT_PAGE_BUTTON);
			const nextPageButton = await Boats24.page.$(locators.NEXT_PAGE_BUTTON);
			const dealerAdsLinks = await Boats24.page.$$(locators.DEALER_ADS_PAGE_LINK);
			for (const link of dealerAdsLinks) {
				const dealerLink = await link.evaluate((el) => {
					return el.href;
				});
				links.push(dealerLink);
			}
			i++;
			await nextPageButton.click();
		} while (links.length < totalResult);
		return links;
	},

	buildJsonOutput: async (data, resultFile) => {
		await fs.writeFile(resultFile, JSON.stringify(data), error => {});
	},
	buildCsvOutput: async (data, resultFile) => {
		await fs.writeFile(resultFile, "Name, Email, Fax Number, Phone Number, Website, Address\n", error => {});
		for (const row of data) {
			await fs.appendFile(resultFile, `"${row.name}", "${row.email}", "${row.faxNumber}", "${row.phoneNumber}", "${row.website}", "${row.address}"\n`, error => {});
		}
	},
};


module.exports = Boats24;
