/**
 * Strategy used in:
 * - His Last Bow
 *
 **/
import helper from '../utils/helper.js';
import _ from 'lodash';

const Strategy = {
  process(window) {
    this.$ = window.$;
    return Strategy
      .removeCruft()
      .then(Strategy.getMetadata)
      .then(Strategy.getElements)
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
    let firstH1 = $('h1:first');
    let secondH2 = $($('h2')[1]);
    let book = helper.getNodeContent(firstH1);
    let author = helper.getNodeContent(secondH2);
    return {book, author, chapterName: book, chapterOrder: 1};
  },
  // Returns all the needed, unfiltered, elements
  getElements(metadata) {
    let $ = Strategy.$;
    let elements = $('p');
    return _.flatten(_.compact(_.map(elements, (element) => {
      let tagName = element.tagName;
      let content = helper.getNodeContent($(element));
      let chunks = helper.splitTextBySentence(content);
      return _.map(chunks, (chunk) => {
        return {...metadata, tagName, content: chunk};
      });
    })));
  },
  debug(elements) {
    // console.info(elements);
    return elements;
  }
};
export default Strategy;



