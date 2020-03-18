const locators = {
  FILTER: {
    CONTAINER: 'div#top',
    COUNTRY_SELECT: 'select[name=land]',
    BOAT_TYPES: 'select[name=boottyp]',
    SUBMIT_BUTTON: 'input[name=go][value=Search]'
  },
  TOTAL_RESULTS_NAV_LINK: '#navi_links',
  DEALER_ADS_CONTAINER: '#main_wrap .hu-suchergebnisbox .hu-suchergebnisbox-in',
  DEALER_ADS_PAGE_LINK: 'div:first-child .haendler_h1:first-child a',
  DEALER_ADS_COUNT_TEXT: './/div[contains(text(), "Advertisements")]',
  NEXT_PAGE_BUTTON: '.sitenumber-navi-in > span:nth-child(3)',
  DEALER_DETAILS: {
    CONTAINER: '#main_content .main-content',
    NAME_TEXT: '.haendler-box-head h1',
    PHONE_TEXT: './/*[@id="haendler_details"]/li//span[text()="Telephone:"]/../span[2]',
    FAX_TEXT: './/*[@id="haendler_details"]/li//span[text()="Fax:"]/../span[2]',
    EMAIL_IMAGE: '#haendler_details > li span:nth-child(2) img',
    WEBSITE_LINK: '#haendler_details > li span:nth-child(2) a',
    ADDRESS_TEXT: '#haendler_details > li.anschrift span:nth-child(2)'
  }
}

module.exports = locators
