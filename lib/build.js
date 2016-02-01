import algoliasearch from 'algoliasearch';
import fs from 'fs';
import jsdom from 'jsdom';
import _ from 'lodash';


let html = 'http://localhost:8040/tales.html';
let metadata = {};
let $;
let appId = 'O3F8QXYK6R';

// Checks the apiKey in ENV and local file
let apiKey = process.env.ALGOLIA_API_KEY;
if (fs.existsSync('./_algolia_api_key')) {
  apiKey = fs.readFileSync('./_algolia_api_key', 'utf8');
}
if (!apiKey) {
  console.info('Usage:');
  console.info('$ ALGOLIA_API_KEY=XXXXX npm run algolia');
  process.exit();
}


// Read the html page
jsdom.env({
  url: html,
  scripts: [
    'http://localhost:8040/jquery.js'
  ],
  done: (_err, window) => {
    $ = window.$;
    let elements = window.$('h1,h2,p');
    console.info(`Found ${elements.length} elements`);
    cleanUpElements(elements);
  }
});

// Cleanup elements by removing empty ones and formatting them as objects
const cleanUpElements = (elements) => {
  let newElements = [];

  _.each(elements, (element) => {
    let tag = element.tagName.toLowerCase();
    let content = $(element).text().trim();
    if (!content) {
      return;
    }
    newElements.push({
      originalElement: element,
      tag,
      content
    });
  });

  console.info(`Cleaned up to ${newElements.length} elements`);

  extractMetadata(newElements);
};

// Will extract the title, subtitle and author from the elements
const extractMetadata = (elements) => {
  let title = null;
  let subtitle = null;
  let author = null;
  let newElements = [];
  newElements = _.map(elements, (element) => {
    // Title is the first h1
    if (element.tag === 'h1' && !title) {
      title = element.content;
      return false;
    }
    // subtitle and author are the first and second h2
    if (element.tag === 'h2') {
      if (!subtitle) {
        subtitle = element.content;
        return false;
      }
      if (!author) {
        author = element.content;
        return false;
      }
    }
    return element;
  });

  author = author.replace('By ', '');
  newElements = _.compact(newElements);
  metadata = {title, subtitle, author};

  console.info(metadata);
  generateRecords(newElements);
};

// Generate records with the chapter hierarchy
const generateRecords = (elements) => {
  let book;
  let chapter;
  let records = _.map(elements, (element, index) => {
    let isBook = checkIfBook(element);
    let isChapter = checkIfChapter(element);

    book = isBook ? element.content : book;
    chapter = isChapter ? element.content : chapter;

    // Grabbing before/after content



    if (isBook || isChapter) {
      return false;
    }

    return {
      ...metadata,
      book,
      chapter,
      isBook,
      isChapter,
      content: element.content
    }
  });

  records = _.compact(records);

  console.info(`Added metadata to all ${records.length} records`);
  pushRecords(records);
};

// Check if a content is a book
const checkIfBook = (element) => {
  return element.tag === 'h2' && /^Book /.test(element.content);
};
// Check if a content is a chapter
const checkIfChapter = (element) => {
  // See: http://stackoverflow.com/questions/267399/how-do-you-match-only-valid-roman-numerals-with-a-regular-expression
  let romanRegexp = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})\. /;
  return element.tag === 'h2' && romanRegexp.test(element.content);
};

const pushRecords = (records) => {
  let client = algoliasearch(appId, apiKey);
  let index = client.initIndex('gutemberg_tmp');
  let indexSettings = {
    attributesToIndex: [
      'content',
      'chapter',
      'book'
    ],
    attributesForFacetting: [
      'book',
      'chapter'
    ],
    hitsPerPage: 300,
    removeWordsIfNoResults: 'allOptional'
  };

  // Push data
  index.addObjects(records)
    .then(() => {
      console.info('Records pushed');
      return index.setSettings(indexSettings);
    })
    .then(() => {
      console.info('Settings updated');
      return client.moveIndex('gutemberg_tmp', 'gutemberg');
    })
    .then(() => {
      console.info('Atomic replace done');
    });
};

