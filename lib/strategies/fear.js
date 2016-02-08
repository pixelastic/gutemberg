/**
 * Strategy used in:
 * - The Valley of Fear
 **/
import helper from '../utils/helper.js';
import _ from 'lodash';

const Strategy = {
  process(book) {
    this.book = book;
    this.$ = book.$;
    return Strategy
      .removeCruft()
      .then(Strategy.getMetadata)
      .then(Strategy.getElements)
      .then(Strategy.removeUselessTitles)
      .then(Strategy.addPartsAndChapters)
      .then(Strategy.addReadableChapterName)
      .then(Strategy.debug)
      ;
  },
  // Remove useless parts from the HTML to make further selection easier
  removeCruft() {
    let $ = Strategy.$;
    $('pre, blockquote').remove();

    $('p').each((index, p) => {
      let $p = $(p);
      let text = helper.getNodeContent($p);
      if (!text) {
        $p.remove();
      }
    });

    return Promise.resolve();
  },
  // Find book name and author
  getMetadata() {
    let $ = Strategy.$;
    let h1 = $('h1:first');
    let h2 = $('h2:first');
    let book = helper.getNodeContent(h1);
    let author = helper.getNodeContent(h2).replace(/^By /, '');
    return {book, author};
  },
  // Returns all the needed, unfiltered, elements
  getElements(metadata) {
    let $ = Strategy.$;
    let elements = $('h1,h2,p');
    return _.flatten(_.map(elements, (element) => {
      let tagName = element.tagName;
      let content = helper.getNodeContent($(element));
      let chunks = helper.splitTextBySentence(content);
      return _.map(chunks, (chunk) => {
        return {...metadata, tagName, content: chunk};
      });
    }));
  },
  // Remove useless titles
  removeUselessTitles(elements) {
    let firstH1Index = _.findIndex(elements, {tagName: 'H1'});
    let firstH2Index = _.findIndex(elements, {tagName: 'H2'});
    elements.splice(firstH1Index, 1);
    elements.splice(firstH2Index - 1, 1);
    return elements;
  },
  // Add chapterName and partName to each element
  addPartsAndChapters(elements) {
    let partName = null;
    let chapterName = null;
    let chapterOrder = 0;
    let order = 0;
    function isPart(title) {
      return /^PART /.test(title);
    }
    return _.compact(_.map(elements, (element) => {
      let isTitle = element.tagName !== 'P';
      let content = element.content;
      order++;

      // Set the current part/chapter
      if (isTitle) {
        order = 0;
        if (isPart(content)) {
          partName = content;
        } else {
          chapterName = content;
          chapterOrder++;
        }
        return null;
      }

      return {...element, chapterOrder, chapterName, partName, order};
    }));
  },
  // Add a readable chapter name
  addReadableChapterName(elements) {
    elements = _.map(elements, (element) => {
      // Skip it if no chapter and name
      if (!element.partName && !element.chapterName) {
        return null;
      }
      let partSplit = element.partName.split('—')[0];
      element.chapterName = `${partSplit}. ${element.chapterName}`;
      delete element.partName;
      return element;
    });

    return _.compact(elements);
  },
  debug(elements) {
    console.info(elements);
    return elements;
  }
};
export default Strategy;

