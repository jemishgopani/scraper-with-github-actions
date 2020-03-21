const locators = {
  DEALERS: {
    LIST_CONTAINER: '#dealers-list',
    DEALER_TAB: 'a[data-parent="#dealers-list"]',
    DEALERS_ROW: (stateId) => {
      return `${stateId} table tr`
    },
    DEALER_WEBSITE: 'a.js-clickme_url',
    DEALER_LINK: 'td:first-child a',
    DEALER_LISTING: 'td:nth-child(3)',
    DEALER_PHONE: '.js-clickme_phone span.hidden',
    DEALER_ADDRESS: '.content-area > div > div:first-child > div:first-child'
  }
}

module.exports = locators
