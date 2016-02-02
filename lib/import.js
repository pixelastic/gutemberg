/**
 * Reads and HTML file of an ebook and creates JSON records of it on disk
 **/
import helper from './utils/helper.js';
import scarletStrategy from './strategies/scarlet.js';
import path from 'path';
import program from 'commander';
import _ from 'lodash';
let strategies = {
  scarlet: scarletStrategy
};

let recordPath = './records';

// Read commandline options
program
  .option('--strategy [name]', 'Select extracting strategy')
  .parse(process.argv);

let htmlFile = program.args[0];
let strategyName = program.strategy || 'scarlet';
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
  .then(addMetadata)
  .then(removeCruft)
  .then(splitInElements)
  .then(addUniqueIDs)
  .then(addContext)
  .then(saveToDisk)
  .then(teardown)
  ;

// Extract book metadata
function addMetadata(window) {
  let $ = window.$;
  let htmlTitle = helper.getNodeContent($('title')).split(', ');
  let bookTitle = htmlTitle[0];
  let bookAuthor = htmlTitle[1].replace('by ', '');

  return {
    book: bookTitle,
    author: bookAuthor,
    $
  };
}

// Remove useless parts from the HTML to make further selection easier
function removeCruft(book) {
  let $ = book.$;
  $('style, pre, .mynote, .toc, .foot, a[name^=linknoteref]').remove();

  $('p').each((index, p) => {
    let $p = $(p);
    let text = helper.getNodeContent($p);
    if (!text) {
      $p.remove();
    }
  });

  return book;
}

// Split the book in elements, one for each matching DOM node
function splitInElements(book) {
  // Use the currently selected strategy
  let strategy = strategies[strategyName];
  if (!strategy) {
    return Promise.reject(`Strategy ${strategyName} does not exist`);
  }
  return strategy.process(book);
}

// Add unique id to each element, to be able to easily deduplicate them
function addUniqueIDs(elements) {
  return _.map(elements, (element) => {
    element.objectID = helper.getUniqueID(element);
    return element;
  });
}

// Add context (before/after)
// TODO: We should add the before/after content as well as their uniqueID
// On eahc loop, we look at the one before in the array and set its next to the
// current
// We also set the current previous as the one before
// That way, at any given time, we only need to know one element id
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

// Save files to disk
function saveToDisk(elements) {
  let groupedElements = _.groupBy(elements, 'chapterOrder');
  let allPromises = _.map(groupedElements, (chapters, chapterIndex) => {
    let filepath = `${outputDir}/chapter-${chapterIndex}.json`;
    return helper.writeJSON(filepath, chapters);
  });

  return Promise.all(allPromises).then(() => {
    return elements;
  });
}

function teardown(results) {
  console.info(results);
}
