/**
 * Reads and HTML file of an ebook and creates JSON records of it on disk
 **/
import helper from './utils/helper.js';
import scarletStrategy from './strategies/scarlet.js';
import adventuresStrategy from './strategies/adventures.js';
import path from 'path';
import program from 'commander';
import zpad from 'zpad';
import _ from 'lodash';
let strategies = {
  scarlet: scarletStrategy,
  adventures: adventuresStrategy
};

let recordPath = './records';

// Read commandline options
program
  .option('--strategy [name]', 'Select extracting strategy')
  .option('--bookOrder [name]', 'Publishing order of the book')
  .parse(process.argv);

let htmlFile = program.args[0];
let strategyName = program.strategy || 'scarlet';
let bookOrder = _.parseInt(program.bookOrder) || 0;
if (!htmlFile) {
  console.info('Usage:');
  console.info('$ npm run import -- book.html');
  process.exit();
}

let basename = path.basename(htmlFile, path.extname(htmlFile));
let outputDir = `${recordPath}/${basename}`;

helper
  .createOutputDir(outputDir)
  .then(helper.readHTML.bind(null, htmlFile))
  .then(splitInElements)
  .then(addUniqueIDs)
  .then(addContext)
  .then(addBookOrder)
  .then(saveToDisk)
  .then(teardown)
  ;

// Split the book in elements, one for each matching DOM node
function splitInElements(window) {
  // Use the currently selected strategy
  let strategy = strategies[strategyName];
  if (!strategy) {
    return Promise.reject(`Strategy ${strategyName} does not exist`);
  }
  return strategy.process(window);
}

// Add unique id to each element, to be able to easily deduplicate them
function addUniqueIDs(elements) {
  return _.map(elements, (element) => {
    element.objectID = helper.getUniqueID(element);
    return element;
  });
}

// Add context (before/after)
function addContext(elements) {
  return _.map(elements, (element, index) => {
    let previousElement = elements[index - 1];

    // Setting an empty context to the current element
    element.context = {previous: null, next: null};

    // If no previous element, we can stop
    if (!previousElement) {
      return element;
    }

    // If the previous element is in another chapter, we also stop
    if (previousElement.chapterOrder !== element.chapterOrder) {
      return element;
    }

    // Setting the previousElement.next
    previousElement.context.next = {
      objectID: element.objectID,
      content: element.content
    };
    // Setting the currentElement.previous
    element.context.previous = {
      objectID: previousElement.objectID,
      content: previousElement.content
    };

    return element;
  });
}

// Add the publishing book order to every item
function addBookOrder(elements) {
  return _.map(elements, (element) => {
    element.bookOrder = bookOrder;
    return element;
  });
}

// Save files to disk
function saveToDisk(elements) {
  let groupedElements = _.groupBy(elements, 'chapterOrder');
  let allPromises = _.map(groupedElements, (chapters, chapterIndex) => {
    let paddedIndex = zpad(chapterIndex);
    let filepath = `${outputDir}/chapter-${paddedIndex}.json`;
    return helper.writeJSON(filepath, chapters);
  });

  return Promise.all(allPromises).then(() => {
    return elements;
  });
}

function teardown(results) {
  console.info(`Import of ${htmlFile} done`);
  // console.info(results);
}
