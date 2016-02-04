(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var _cmp = 'components/';
  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf(_cmp) === 0) {
        start = _cmp.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return _cmp + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var _reg = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (_reg.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  require._cache = cache;
  globals.require = require;
})();
require.register("app", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Sherlock = {
  init: function init() {
    this.search = instantsearch({
      appId: 'O3F8QXYK6R',
      apiKey: '315734cd612e89d2c548256293799f0c',
      indexName: 'gutenberg',
      searchParameters: {
        distinct: 2
      }
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
  transformHit: function transformHit(data) {
    console.info(data);
    // Context
    var previous = data.context.previous ? data.context.previous.content : null;
    var next = data.context.next ? data.context.next.content : null;

    // Book and chapter
    var book = data.book;
    var chapter = data.chapterName;

    // Content
    var content = Sherlock.getHighlightedValue(data, 'content');

    return {
      previous: previous,
      content: content,
      next: next,
      book: book,
      chapter: chapter
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
  getHighlightedValue: function getHighlightedValue(object, property) {
    if (!_.has(object, '_highlightResult.' + property + '.value')) {
      console.info(object, property);
      return object[property];
    }
    return object._highlightResult[property].value;
  },
  addSearchBoxWidget: function addSearchBoxWidget() {
    this.search.addWidget(instantsearch.widgets.searchBox({
      container: '#q',
      placeholder: 'Search in all Sherlock Holmes books'
    }));
  },
  addStatsWidget: function addStatsWidget() {
    this.search.addWidget(instantsearch.widgets.stats({
      container: '#stats'
    }));
  },
  addClearAllWidget: function addClearAllWidget() {
    this.search.addWidget(instantsearch.widgets.clearAll({
      container: '#clear-all',
      templates: {
        link: '<i class="fa fa-eraser"></i> Clear all filters'
      },
      cssClasses: {
        root: 'btn btn-block btn-default'
      },
      autoHideContainer: true
    }));
  },
  addBookWidget: function addBookWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#books',
      attributeName: 'book',
      operator: 'or',
      limit: 10
    }));
  },
  addChapterWidget: function addChapterWidget() {
    this.search.addWidget(instantsearch.widgets.refinementList({
      container: '#chapters',
      attributeName: 'chapterName',
      operator: 'or',
      limit: 8
    }));
  },
  addHitsWidget: function addHitsWidget() {
    var hitTemplate = $('#hitTemplate').html();
    var emptyTemplate = $('#noResultsTemplate').html();
    this.search.addWidget(instantsearch.widgets.hits({
      container: '#hits',
      hitsPerPage: 40,
      templates: {
        empty: emptyTemplate,
        item: hitTemplate
      },
      transformData: {
        item: Sherlock.transformHit
      }
    }));
  },
  addPaginationWidget: function addPaginationWidget() {
    this.search.addWidget(instantsearch.widgets.pagination({
      container: '#pagination',
      cssClasses: {
        active: 'active'
      },
      labels: {
        previous: '<i class="fa fa-angle-left fa-2x"></i> Previous page',
        next: 'Next page <i class="fa fa-angle-right fa-2x"></i>'
      },
      showFirstLast: false
    }));
  }
};

exports.default = Sherlock;
});


//# sourceMappingURL=main.js.map