/**
 * Reads and HTML file of an ebook and creates JSON records of it on disk
 **/
import helper from './utils/helper.js';
import path from 'path';
import program from 'commander';
import {toArabic} from 'roman-numerals';
import _ from 'lodash';

let recordPath = './records';

// Read commandline options
program
  .parse(process.argv);

let htmlFile = program.args[0];
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
  .then(convertRomanNumerals)
  .then(groupByChapters)
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
  let $ = book.$;

  let chapter = null;
  let part = null;

  let elements = _.map($('h2,p'), (element) => {
    let tagName = element.tagName;
    let content = helper.getNodeContent($(element));

    if (tagName === 'H2') {
      // Skipping title which repeats the author
      if (content === `By ${book.author}`) {
        return null;
      }
      // Split by parts (PART I, PART II)
      if (/^PART /.test(content)) {
        part = content;
        return null;
      }

      chapter = content;
      return null;
    }

    // Excluding elements that have no parent chapter
    // This can happen for preliminary texts that are not yet in the bulk of the
    // book
    if (!chapter) {
      return null;
    }

    return {
      content,
      chapter,
      part,
      book: book.book,
      author: book.author
    };
  });

  return _.compact(elements);
}

// Convert roman numerals to numbers
function convertRomanNumerals(elements) {
  return _.map(elements, (element) => {
    let romanPart = element.part.replace(/^PART ([IVXLCDM]*)\.(.*)/, '$1');
    let romanChapter = element.chapter.replace(/^CHAPTER ([IVXLCDM]*)\.(.*)/, '$1');
    element.part = toArabic(romanPart);
    element.chapter = toArabic(romanChapter);
    return element;
  });
}

// Group elements by part/chapter
function groupByChapters(elements) {
  let groupedByPart = _.groupBy(elements, 'part');
  let results = {};
  _.each(groupedByPart, (partElements, part) => {
    results[part] = _.groupBy(partElements, 'chapter');
  });

  return results;
}

// Add context (before/after)
function addContext(elements) {
  _.each(elements, (chapters) => {
    _.each(chapters, (chapterElements) => {
      let maxIndex = chapterElements.length - 1;
      _.each(chapterElements, (element, index) => {
        let before = (index > 0) ? chapterElements[index - 1].content : null;
        let after = (index < maxIndex) ? chapterElements[index + 1].content : null;
        element.context = {before, after};
      });
    });
  });

  return elements;
}

// Save files to disk
function saveToDisk(elements) {
  let allPromises = [];

  _.each(elements, (chapters, part) => {
    _.each(chapters, (chapterElements, chapter) => {
      let filepath = `${outputDir}/${part}-${chapter}.json`;
      allPromises.push(helper.writeJSON(filepath, chapterElements));
    });
  });

  return Promise.all(allPromises).then(() => {
    return elements;
  });
}

function teardown(results) {
  console.info(results);
  // console.info(results[2][7]);
}



// function removeCruft(window) {
//   let $ = window.$;
//   console.info($('a').text());
// }



// Parsing the commandline options
// Reading the file
// Removing cruft
// Splitting by chapters
//   Converting one chapter
//   Saving it to disk
