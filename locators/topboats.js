const locators = {
    DEALER_PAGE_LINK: '.nombre_empresa',
    DEALER_PAGINATION_NEXT_BUTTON_LINK: '.listingBar .next',
    DEALER_TOTAL_RESULTS_TEXT: '#empresas_en_lista .description span',
    DEALER:{
        LOOK_AT_ALL_ADS_LINK: './/*[@class="sec" and contains(text(), "Look at all ads of")]',
        USED_BOATS_LINK: './/*[@class="sec" and contains(text(), "Used boats")]',
        CHARTER_LINK: './/*[@class="sec" and contains(text(), "Charter")]',
        NEW_LINK: './/*[@class="sec" and contains(text(), "New")]',
        MOORINGS_LINK: './/*[@class="sec" and contains(text(), "Moorings")]',
        ADDRESS_TEXT: '.loc',
        VIEW_PHONE_LINK: '#ver_telefono',
        UID: '#uid',
        VIEW_WEBSITE: '#ver_web',
        WEBSITE_LINK: '.web_escondida'

    }
}

module.exports = locators