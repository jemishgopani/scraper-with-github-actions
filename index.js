const Boats24 = require('./scrapers/boats24')
const GoogleDrive = require('./utils/drive')
const TheYachtMarket = require('./scrapers/theyachtmarket');

(async () => {
  await Boats24.start()
  await TheYachtMarket.start()
  await GoogleDrive.save()
})()
