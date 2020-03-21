const fs = require('fs')
const jimp = require('jimp')
const tesseract = require('tesseract.js')
const axios = require('axios')
const loader = require('../utils/load')
const path = require('path')

const DataProcess = {
  data: null,
  finalData: [],
  trainingDataPath: null,
  loader: null,

  init: async (data, trainingDataPath) => {
    DataProcess.data = data
    DataProcess.trainingDataPath = trainingDataPath
  },

  downloadEmailImages: async () => {
    // Downloading all email images of dealers
    let index = -1
    for (const link of DataProcess.data) {
      const timestamp = new Date().getTime()
      const emailImageLink = link.email
      const emailTrainingImagePath = path.resolve(__dirname, `../${DataProcess.trainingDataPath}`, `${timestamp}.png`)
      await axios({
        url: emailImageLink,
        responseType: 'stream'
      }).then(
        response => new Promise((resolve, reject) => {
          response.data
            .pipe(fs.createWriteStream(emailTrainingImagePath))
            .on('finish', async () => {
              const images = ['canvas.png', emailTrainingImagePath]
              const jimps = []
              for (let i = 0; i < images.length; i++) {
                jimps.push(jimp.read(images[i]))
              }
              await Promise.all(jimps).then(() => {
                return Promise.all(jimps)
              }).then(async (data) => {
                await data[1].resize(data[1].getWidth() + 250, data[1].getHeight() + data[1].getHeight()).quality(100)
                await data[0].resize(data[1].getWidth(), data[1].getHeight()).quality(100)
                await data[0].composite(data[1], 15, 0).quality(100)
                await data[0].write(emailTrainingImagePath, async () => {
                  DataProcess.finalData.push(emailTrainingImagePath)
                  DataProcess.data[index].email = emailTrainingImagePath
                })
              })
              resolve()
            })
            .on('error', e => reject(e))
        })
      )
      index++
    }
    await loader.success('Dealer email images are downloaded.')
    await Promise.resolve()
  },

  processOnData: async () => {
    await DataProcess.downloadEmailImages()

    // Recognizing emails from images
    for (const emailTrainingImagePath of DataProcess.finalData) {
      await tesseract.recognize(
        emailTrainingImagePath,
        'eng'
      ).then(({ data: { text } }) => {
        for (let i = 0; i < DataProcess.data.length; i++) {
          if (DataProcess.data[i].email === emailTrainingImagePath) {
            DataProcess.data[i].email = text.replace(/\s/g, '')
          }
        }
        Promise.resolve()
      })
    }
    await loader.success('Email images converted to email string.')
    await Promise.all(DataProcess.finalData)
    return DataProcess.data
  }
}
module.exports = DataProcess
