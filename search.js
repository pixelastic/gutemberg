/* global instantsearch */

var search = instantsearch({
  appId: 'O3F8QXYK6R',
  apiKey: '33d75f9246cafab47ca6a6c1d4dfd760',
  indexName: 'gutemberg',
  // urlSync: true
});

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#q',
    placeholder: "Search in 'A Tale of Two Cities'"
  })
);

var hitTemplate = $('#hitTemplate').html();

var noResultsTemplate =
  '<div class="text-center">No results for <strong>{{query}}</strong>.</div>';



function getHighlightedValue(object, property) {
  if (!object._highlightResult
      || !object._highlightResult[property]
      || !object._highlightResult[property].value) {
    return object[property];
  }
  return object._highlightResult[property].value;
}


search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits',
    hitsPerPage: 200,
    templates: {
      empty: noResultsTemplate,
      item: hitTemplate
    },
    transformData: {
      item: function (data) {
        var book = getHighlightedValue(data, 'book');
        var chapter = getHighlightedValue(data, 'chapter');
        var content = getHighlightedValue(data, 'content');
        return {
          book:book,
          chapter:chapter,
          content:content
        };
      }
    }
  })
);

search.addWidget(
  instantsearch.widgets.stats({
    container: '#stats'
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#books',
    attributeName: 'book',
    operator: 'or',
    limit: 10
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#chapters',
    attributeName: 'chapter',
    operator: 'or',
    limit: 8
  })
);

search.addWidget(
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

search.addWidget(
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

search.start();

$('#q').focus();
