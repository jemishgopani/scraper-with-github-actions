const Boats24 = require('./scrapers/boats24')
const GoogleDrive = require('./utils/drive')
const BoatsOnline = require('./scrapers/boatsonline');
const TheYachtMarket = require('./scrapers/theyachtmarket');

(async () => {
  await Boats24.start()
  await BoatsOnline.start()
  await TheYachtMarket.start()
  await GoogleDrive.save()
})()
