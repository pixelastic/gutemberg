/**
 * Strategy used in:
 * - The Sign of the Four
 *
 * One book, with several chapters, where each chapter name is split into two h3
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
      .then(Strategy.addChapters)
      // .then(Strategy.debug)
      ;
  },
  // Remove useless parts from the HTML to make further selection easier
  removeCruft() {
    let $ = Strategy.$;
    $('table, pre').remove();

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
    let book = helper.getNodeContent($('h1'));
    let author = helper.getNodeContent($('h2:first'));
    return {book, author};
  },
  // Returns all the needed, unfiltered, elements
  getElements(metadata) {
    let $ = Strategy.$;
    let elements = $('a[name^="chap"],p');
    return _.flatten(_.map(elements, (element) => {
      let $element = $(element);
      let tagName = element.tagName;
      let content;
      // For anchors, we need to grab the chapter name
      if (tagName === 'A') {
        let firstH3 = $element.next('h3');
        let secondH3 = firstH3.next('h3');
        content = helper.getNodeContent(firstH3) + '. ' + helper.getNodeContent(secondH3);
      } else {
        content = helper.getNodeContent($(element));
      }
      let chunks = helper.splitTextBySentence(content);
      return _.map(chunks, (chunk) => {
        return {...metadata, tagName, content: chunk};
      });
    }));
  },
  // Add chapters name and order
  addChapters(elements) {
    let chapterName = null;
    let chapterOrder = 0;
    let order = 0;

    return _.compact(_.map(elements, (element) => {
      let isTitle = element.tagName === 'A';
      let content = element.content;
      order++;

      // Set the current chapter
      if (isTitle) {
        order = 0;
        chapterName = content;
        chapterOrder++;
        return null;
      }

      return {...element, chapterOrder, chapterName, order};
    }));
  },
  debug(elements) {
    console.info(elements);
    return elements;
  }
};
export default Strategy;

