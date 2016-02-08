let Sherlock = {
  init() {
    this.search = instantsearch({
      appId: 'O3F8QXYK6R',
      apiKey: '315734cd612e89d2c548256293799f0c',
      indexName: 'gutenberg'
      // searchParameters: {
      //   distinct: 2
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
  transformHit(data) {
    console.info(data);
    // Context
    let previous = data.context.previous ? data.context.previous.content : null;
    let next = data.context.next ? data.context.next.content : null;

    // Book and chapter
    let book = data.book;
    let chapter = data.chapterName;

    // Content
    let content = Sherlock.getHighlightedValue(data, 'content');

    return {
      previous,
      content,
      next,
      book,
      chapter
    };
    // var book = getHighlightedValue(data, 'book');
    // var chapter = getHighlightedValue(data, 'chapter');
    // var content = getHighlightedValue(data, 'content');
    // return {
    //   book: book,
    //   chapter: chapter,
    //   content: content
    // };
  },
  getHighlightedValue(object, property) {
    if (!_.has(object, `_highlightResult.${property}.value`)) {
      console.info(object, property);
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
    let hitTemplate = $('#hitTemplate').html();
    let emptyTemplate = $('#noResultsTemplate').html();
    this.search.addWidget(
      instantsearch.widgets.hits({
        container: '#hits',
        hitsPerPage: 40,
        templates: {
          empty: emptyTemplate,
          item: hitTemplate
        },
        transformData: {
          item: Sherlock.transformHit
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
