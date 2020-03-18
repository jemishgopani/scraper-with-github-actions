const Boats24 = require('./scrapers/boats24')
const GoogleDrive = require('./utils/drive');

(async () => {
  await Boats24.start()
  await GoogleDrive.save()
})()
