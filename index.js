const moment = require("moment");
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

let startingDate = moment("2013-03-30");
let endingDate = moment("2015-04-25");

function getUrl(date) {
  let baseUrl = "https://www.thecurrent.org/programs/pos-is-ruining-the-current/";
  let completeUrl = baseUrl + date.format("YYYY/MM/DD");
  return completeUrl;
}

function getDatesBetween(start, end) {
  let datesBetween = [];
  let lastDate = startingDate;
  while (lastDate < end) {
    datesBetween.push(lastDate);
    lastDate = lastDate.clone().add(7, "days");
  }

  return datesBetween;
}

function getUrlAndDates() {
  let datesBetween = getDatesBetween(startingDate, endingDate);
  let startingData = datesBetween.map(date => {
    let url = getUrl(date);
    return {
      url,
      date
    }
  });
  return startingData;  
}

function parseTrackListFromResponseBody(responseBody) {
  const dom = new JSDOM(responseBody);
  const doc = dom.window.document;
  let trackElements = doc.querySelectorAll("section.segment article")  
  let tracklist = [];
  trackElements.forEach(track => {
    let title = track.querySelector("h3").textContent
    let artist = track.textContent.replace(title, "").trim()

    tracklist.push({
      title: title,
      artist: artist
    })
  })

  return tracklist;
}

function getMp3Url(programDate) {
  let year = programDate.format("YYYY")
  let month = programDate.format("MM")
  let day = programDate.format("DD")

  return `https://download.stream.publicradio.org/minnesota/the_current/programs/${year}/${month}/${day}/pos_ruining_the_current_${year}${month}${day}_128.mp3`
}

async function fetchTrackListFromUrl(url) {
  try {
    let response = await fetch(url)
    let body = await response.text()
    let tracklist = parseTrackListFromResponseBody(body)
    
    return tracklist;

  } catch (e) {
    throw { 
      url: url, 
      message: e
    };
  }
}

async function getTrackListAndMp3Url(startingData) {
  try {
      let tracklist = await fetchTrackListFromUrl(startingData.url);
      if(tracklist.length == 0) {
        throw {
          url: startingData.url,
          error: "Tracklist is empty"
        }
      }

      let data = {
        url: startingData.url,
        date: startingData.date,
        tracklist: tracklist,
        mp3Url: getMp3Url(startingData.date)
      };

      return data
    } catch (error) {
      let data = {
        url: error.url,
        error: error.message
      };

      return data
    };
}


let startingData = getUrlAndDates()

async function main() {
  let shorterStartingData = startingData
  let moreData = await Promise.all(shorterStartingData.map(startingData => getTrackListAndMp3Url(startingData) ));
  console.log(require('util').inspect(moreData, true, 10))
}

main()
