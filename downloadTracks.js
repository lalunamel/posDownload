const fs = require('fs');
const request = require('request');
const moment = require("moment");

async function downloadFile(filename, url) {
	return new Promise((resolve, reject) => {
		try {
			let file = fs.createWriteStream(filename);
			console.log("Downloading file " + filename)
			request
				.get(url)
				.on('error', e => {
					console.log("Error downloading file " + filename)
					reject(e)
				})
				.on('response', _ => {
					console.log("Finished downloading file " + filename)
					resolve()
				})
				.pipe(file)
		} catch (e) {
			reject(e)
		}
	})
}

async function writeTracklist(filename, tracklist) {
	return new Promise((resolve, reject) => {
		console.log("Writing file " + filename);
		let fileContents = tracklist.reduce((accum, track) => {
			let spacing = accum.length === 0 ? "" : "\n\n";
			return accum + spacing + track.artist + "\n" + track.title;
		}, "");
		let file = fs.writeFile(filename, fileContents, (err) => {
			if(err) {
				reject(err)
			} else {
				resolve()				
			}
		});
	})
}

function getMp3Filename(d) {
	let date = moment(d)
	return date.format("YYYY-MM-DD[.mp3]")
}

function getTracklistFilename(d) {
	let date = moment(d)
	return date.format("YYYY-MM-DD[-tracklist.txt]")
}

function addFilenames(data) {
	return data.map(item => {
		let mp3Filename = getMp3Filename(item.date)
		let tracklistFilename = getTracklistFilename(item.date)

		return Object.assign({}, item, {mp3Filename, tracklistFilename})
	})
}

async function main() {
	let metadata = JSON.parse(fs.readFileSync("metadata.json")).filter(data => data.error === undefined)
	
	metadata = metadata.slice(0,1);

	let filenamesAndUrls = addFilenames(metadata)
	console.log(filenamesAndUrls)
	// await Promise.all(filenamesAndUrls.map( item => downloadFile(item.mp3Filename, item.mp3Url) ))
	Promise.all(filenamesAndUrls.map( item => writeTracklist(item.tracklistFilename, item.tracklist)))
	
}

main();