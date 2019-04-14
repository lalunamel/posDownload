const moment = require("moment");
const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

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

function parseMp3UrlFromResponseBody(responseBody) {
  const dom = new JSDOM(responseBody);
  const doc = dom.window.document;
  let mp3UrlFromPlayerElement = doc.querySelector(".js-player").getAttribute("data-src");

  return "http:" + mp3UrlFromPlayerElement;
}

async function fetchTrackListAndMp3UrlFromUrl(url) {
  try {
    console.log("fetching " + url)
    let response = await fetch(url)
    let body = await response.text()
    console.log("parsing " + url)
    let tracklist = parseTrackListFromResponseBody(body)
    let mp3Url = parseMp3UrlFromResponseBody(body)
    
    return {tracklist, mp3Url};

  } catch (e) {
    throw { 
      url: url, 
      message: e.toString()
    };
  }
}

async function getTrackListAndMp3Url(startingData) {
  try {
      let {tracklist, mp3Url} = await fetchTrackListAndMp3UrlFromUrl(startingData.url);
      if(tracklist.length == 0 || mp3Url.length == 0) {
        throw {
          url: startingData.url,
          tracklist: tracklist,
          mp3Url: mp3Url,
          message: "Tracklist or mp3Url is empty"
        }
      }

      let data = {
        url: startingData.url,
        date: startingData.date,
        tracklist: tracklist,
        mp3Url: mp3Url
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



async function main() {
  let startingData = getUrlAndDates()
  let trackListsAndMp3Urls = await Promise.all(startingData.map(startingData => getTrackListAndMp3Url(startingData) ));
  
  fs.writeFileSync("metadata.json", JSON.stringify(trackListsAndMp3Urls, null, 2));
}

main()
