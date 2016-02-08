/**
 * Push records in ./records to the Algolia index and configure the index
 **/
import helper from './utils/helper.js';
import algoliasearch from 'algoliasearch';
import fs from 'fs';
import _ from 'lodash';

let recordPath = './records';
let appId = 'O3F8QXYK6R';
let indexName = 'gutenberg';

// Checks the apiKey in ENV and local file
let apiKey = process.env.ALGOLIA_API_KEY;
if (fs.existsSync('./_algolia_api_key')) {
  apiKey = fs.readFileSync('./_algolia_api_key', 'utf8');
}
if (!apiKey) {
  console.info('Usage:');
  console.info('$ ALGOLIA_API_KEY=XXXXX npm run push');
  process.exit();
}
let client = algoliasearch(appId, apiKey);
let indexNameTmp = `${indexName}_tmp`;
let indexTmp = client.initIndex(indexNameTmp);

helper
  .getFilelist(`${recordPath}/**/*.json`)
  .then(getAllElements)
  .then(pushRecords)
  ;

// Reads all file and return the merged list of records
function getAllElements(files) {
  let allFiles = _.map(files, (file) => {
    return helper.readJSON(file);
  });

  return Promise.all(allFiles).then(_.flatten);
}

// Push data
function pushRecords(elements) {
  let indexSettings = {
    attributesToIndex: [
      'unordered(content)',
      'chapterName',
      'book'
    ],
    attributesForFacetting: [
      'author',
      'book',
      'chapterName'
    ],
    customRanking: [
      'asc(bookOrder)',
      'asc(chapterOrder)',
      'asc(order)'
    ],
    attributeForDistinct: 'bookOrder'
  };

  return indexTmp.setSettings(indexSettings)
    .then(() => {
      console.info(`Settings set on index ${indexNameTmp}`);
      return indexTmp.addObjects(elements);
    })
    .then(() => {
      console.info(`${elements.length} records added to ${indexNameTmp}`);
      return client.moveIndex(indexNameTmp, indexName);
    })
    .then(() => {
      console.info(`Index ${indexNameTmp} renamed to ${indexName}`);
      return elements;
    });
}
