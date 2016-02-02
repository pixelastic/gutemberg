/**
 * Strategy used in:
 * - Adventures of Sherlock Holmes
 *
 **/
import helper from '../utils/helper.js';
import _ from 'lodash';

const Strategy = {
  process(window) {
    this.$ = window.$;
    return Strategy
      .getMetadata()
      .then(Strategy.getElements)
      .then(Strategy.removeCruft)
      .then(Strategy.addChapters)
      // .then(Strategy.debug)
      ;
  },
  // Find book name and author
  getMetadata() {
    let $ = Strategy.$;
    let book = helper.getNodeContent($('h1').filter(':first'));
    let author = helper.getNodeContent($('h2').filter(':first'));
    return Promise.resolve({book, author});
  },
  // Returns all the needed, unfiltered, elements
  getElements(metadata) {
    let $ = Strategy.$;
    let elements = $('h3,p');
    return _.map(elements, (element) => {
      let tagName = element.tagName;
      let content = helper.getNodeContent($(element));
      return {...metadata, tagName, content};
    });
  },
  // Remove useless titles
  removeCruft(elements) {
    // One of the h3 will symply be the "BY" in the title. We remove it
    let byIndex = _.findIndex(elements, {tagName: 'H3', content: 'BY'});
    elements.splice(byIndex, 1);

    // Some chapters starts with 'ADVENTURE ' and others don't. We remove it
    // everywhere
    elements = _.map(elements, (element) => {
      let isTitle = element.tagName === 'H3';
      if (!isTitle) {
        return element;
      }
      element.content = element.content.replace(/^ADVENTURE /, '');
      return element;
    });

    return elements;
  },
  // Add chapterName to each element
  addChapters(elements) {
    let chapterName = null;
    let chapterOrder = 0;
    let order = 0;

    return _.compact(_.map(elements, (element) => {
      let isTitle = element.tagName === 'H3';
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

