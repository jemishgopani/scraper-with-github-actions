const fs = require("fs");
const jimp = require("jimp");
const tesseract = require("tesseract.js");
const axios = require("axios");
const loader = require("../utils/load");


const DataProcess = {
	data: null,
	finalData: [],
	trainingDataPath: null,
	loader: null,

	init: async (data, trainingDataPath) => {
		DataProcess.data = data;
		DataProcess.trainingDataPath = trainingDataPath;
	},

	downloadEmailImages: async () =>{
		// Downloading all email images of dealers
		let index = -1;
		for(let link of DataProcess.data){
			let timestamp = new Date().getTime();
			let emailImageLink = link.email;
			let emailTrainingImagePath = `${DataProcess.trainingDataPath}/${timestamp}.png`;
			await axios({
				url: emailImageLink,
				responseType: "stream",
			}).then(
				response => new Promise((resolve, reject) => { response.data
					.pipe(fs.createWriteStream(emailTrainingImagePath))
					.on("finish", async () => {
						const images = ["canvas.png",emailTrainingImagePath];
						let jimps = [];
						for(let i = 0; i < images.length; i++){
							jimps.push(jimp.read(images[i]));
						}
						await Promise.all(jimps).then(() => {
							return Promise.all(jimps);
						}).then( async (data) => {
							await data[1].resize(data[1].getWidth()+250, data[1].getHeight()+data[1].getHeight()).quality(100);
							await data[0].resize(data[1].getWidth(), data[1].getHeight()).quality(100);
							await data[0].composite(data[1],15,0).quality(100);
							await data[0].write(emailTrainingImagePath, async () => {
								DataProcess.finalData.push(emailTrainingImagePath);
								DataProcess.data[index].email = emailTrainingImagePath;
							});
						});
						resolve();})
					.on("error", e => reject(e));
				}),
			);
			index++;
		}
		await loader.success("Dealer email images are downloaded.");
		await Promise.resolve();
	},

	processOnData: async () => {
		await DataProcess.downloadEmailImages();

		// Recognizing emails from images
		let counter = 1;
		for (let emailTrainingImagePath of DataProcess.finalData) {
			await tesseract.recognize(
				emailTrainingImagePath,
				"eng"
			).then(({ data: { text } }) => {
				for(let i = 0; i < DataProcess.data.length; i++){
					if(DataProcess.data[i].email === emailTrainingImagePath){
						DataProcess.data[i].email = text.replace(/\s/g,"");
					}
				}
				Promise.resolve();
			});
			counter++;
		}
		await loader.success("Email images converted to email string.");
		await Promise.all(DataProcess.finalData);
		return DataProcess.data;
	},
};
module.exports = DataProcess;