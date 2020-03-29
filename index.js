// const Boats24 = require('./scrapers/boats24')
const GoogleDrive = require('./utils/drive')
// const TheYachtMarket = require('./scrapers/theyachtmarket');
const TopBoats = require('./scrapers/topboats');

(async () => {
  // await Boats24.start()
  // await TheYachtMarket.start()
  await TopBoats.start()
  await GoogleDrive.save()
})()
