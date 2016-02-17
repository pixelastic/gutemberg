let Sherlock = {
  init() {
    this.search = instantsearch({
      appId: 'O3F8QXYK6R',
      apiKey: '315734cd612e89d2c548256293799f0c',
      indexName: 'gutenberg'
      // searchParameters: {
      //   distinct: 10
      // }
    });

    this.addSearchBoxWidget();
    this.addStatsWidget();
    this.addClearAllWidget();
    this.addBookWidget();
    this.addChapterWidget();
    this.addHitsWidget();
    this.addPaginationWidget();

    this.search.start();

    $('#q').focus();
  },
  // Simplify hits to be used in a Hogan template. Merge sequential elements
  // into one.
  transformAllHits(data) {
    let hits = [];
    let previousHit = {nextId: null};
    _.each(data.hits, (hit) => {
      // Context
      let previous = hit.context.previous ? hit.context.previous.content : null;
      let next = hit.context.next ? hit.context.next.content : null;
      let nextID = hit.context.next ? hit.context.next.objectID : null;
      // Content
      let content = Sherlock.getHighlightedValue(hit, 'content');
      // Book and chapter
      let book = hit.book;
      let chapter = hit.chapterName;

      // This hit is directly following the previous one, so we just update the
      // previous one
      if (hit.objectID === previousHit.nextID) {
        previousHit.content.push(content);
        previousHit.nextID = nextID;
        previousHit.next = next;
        return;
      }

      let cleanHit = {
        previous,
        content: [content],
        next,
        nextID,
        book,
        chapter
      };
      previousHit = cleanHit;

      hits.push(cleanHit);
    });

    data.hits = hits;
    return data;
  },
  getHighlightedValue(object, property) {
    if (!_.has(object, `_highlightResult.${property}.value`)) {
      return object[property];
    }
    return object._highlightResult[property].value;
  },
  addSearchBoxWidget() {
    this.search.addWidget(
      instantsearch.widgets.searchBox({
        container: '#q',
        placeholder: 'Search in all Sherlock Holmes books'
      })
    );
  },
  addStatsWidget() {
    this.search.addWidget(
      instantsearch.widgets.stats({
        container: '#stats'
      })
    );
  },
  addClearAllWidget() {
    this.search.addWidget(
      instantsearch.widgets.clearAll({
        container: '#clear-all',
        templates: {
          link: '<i class="fa fa-eraser"></i> Clear all filters'
        },
        cssClasses: {
          root: 'btn btn-block btn-default'
        },
        autoHideContainer: true
      })
    );
  },
  addBookWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#books',
        attributeName: 'book',
        operator: 'or',
        limit: 10
      })
    );
  },
  addChapterWidget() {
    this.search.addWidget(
      instantsearch.widgets.refinementList({
        container: '#chapters',
        attributeName: 'chapterName',
        operator: 'or',
        limit: 8
      })
    );
  },
  addHitsWidget() {
    let hitsTemplate = $('#hitsTemplate').html();
    let emptyTemplate = $('#noResultsTemplate').html();
    this.search.addWidget(
      instantsearch.widgets.hits({
        container: '#hits',
        hitsPerPage: 40,
        templates: {
          empty: emptyTemplate,
          allItems: hitsTemplate
        },
        transformData: {
          allItems: Sherlock.transformAllHits
        }
      })
    );
  },
  addPaginationWidget() {
    this.search.addWidget(
      instantsearch.widgets.pagination({
        container: '#pagination',
        cssClasses: {
          active: 'active'
        },
        labels: {
          previous: '<i class="fa fa-angle-left fa-2x"></i> Previous page',
          next: 'Next page <i class="fa fa-angle-right fa-2x"></i>'
        },
        showFirstLast: false
      })
    );
  }
};

export default Sherlock;
