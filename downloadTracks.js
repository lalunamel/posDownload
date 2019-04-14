const fs = require('fs');
const request = require('request');
const progress = require('request-progress');
const moment = require("moment");

async function downloadFile(filename, url) {
	return new Promise((resolve, reject) => {
		try {
			let file = fs.createWriteStream(filename);
			console.log("Downloading mp3 " + filename)
			progress(request(url, (error, response, body) => {
				if(response.statusCode != 200) {
					console.log("Error: got " + response.statusCode + " back from " + url)
					resolve()
				}
			}))
				.on('progress', progress => console.log("Downloading mp3 " + filename + " " + (parseInt(progress.percent * 100))))
				.on('error', e => {
					console.log("Error downloading mp3 " + filename)
					reject(e)
				})
				.on('end', _ => {
					console.log("Finished downloading mp3 " + filename)
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
		console.log("Writing track list " + filename);
		let fileContents = tracklist.reduce((accum, track) => {
			let spacing = accum.length === 0 ? "" : "\n\n";
			return accum + spacing + track.artist + "\n" + track.title;
		}, "");
		let file = fs.writeFile(filename, fileContents, (err) => {
			console.log("Finished writing track list " + filename);
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
	
	metadata = metadata.slice(0,5);

	let filenamesAndUrls = addFilenames(metadata)
	console.log(filenamesAndUrls.map(it => it.url))
	await Promise.all(filenamesAndUrls.map( item => {
		downloadFile(item.mp3Filename, item.mp3Url) 
	}))
	await Promise.all(filenamesAndUrls.map( item => writeTracklist(item.tracklistFilename, item.tracklist)))
}

main();