const fs = require('fs');
const request = require('request');
const moment = require("moment");

async function downloadFile(filename, url) {
	return new Promise((resolve, reject) => {
		try {
			let file = fs.createWriteStream(filename);
			
			request
				.get(url)
				.on('error', e => reject(e))
				.on('response', _ => resolve())
				.pipe(file)
		} catch (e) {
			reject(e)
		}
	})
}

function getFilename(d) {
	let date = moment(d)
	return date.format("YYYY-MM-DD[.mp3]")
}

function addFilenames(data) {
	return data.map(item => {
		let filename = getFilename(item.date)

		return Object.assign({}, item, {filename})
	})
}

async function main() {
	let metadata = JSON.parse(fs.readFileSync("metadata.json")).filter(data => data.error === undefined)
	
	metadata = metadata.slice(0,1);

	let filenamesAndUrls = addFilenames(metadata)
	
	await Promise.all(filenamesAndUrls.map( item => downloadFile(item.filename, item.mp3Url) ))
}

main();