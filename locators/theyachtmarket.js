const locators = {
    COUNTRY_LINK: '.broker-continent a',
    DEALER_CONTAINER: '.brokerLogoContainer',
    PAGINATION_LINK: '.atoz a',
    DEALER_PAGE_LINK: 'a[id*=ContentPlaceHolder1_ContentPlaceHolder1_lvBrokers_hlHeader]',
    DEALER: {
        ADDRESS:{
            ADDRESS_TEXT: '.adr',
            STREET_TEXT: '.street-address',
            REGION_TEXT: '.region',
            POSTAL_CODE_TEXT: '.postal-code',
            COUNTRY_NAME_TEXT: '.country-name'
        },
        REVEAL_MOBILE_NUMBER_BUTTON: '#brokerPhoneNumber',
        MOBILE_NUMBER_TEXT: 'span#spnPhoneNumber',
        WEBSITE_LINK: 'a[original-title="Go to website"]'
    }
}

module.exports = locators