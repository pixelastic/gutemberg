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
  transformAllHits: function transformAllHits(data) {
    var hits = [];
    var previousHit = { nextId: null };
    _.each(data.hits, function (hit) {
      // Context
      var previous = hit.context.previous ? hit.context.previous.content : null;
      var next = hit.context.next ? hit.context.next.content : null;
      var nextID = hit.context.next ? hit.context.next.objectID : null;
      // Content
      var content = Sherlock.getHighlightedValue(hit, 'content');
      // Book and chapter
      var book = hit.book;
      var chapter = hit.chapterName;

      // This hit is directly following the previous one, so we just update the
      // previous one
      if (hit.objectID === previousHit.nextID) {
        previousHit.content.push(content);
        previousHit.nextID = nextID;
        previousHit.next = next;
        return;
      }

      var cleanHit = {
        previous: previous,
        content: [content],
        next: next,
        nextID: nextID,
        book: book,
        chapter: chapter
      };
      previousHit = cleanHit;

      hits.push(cleanHit);
    });

    data.hits = hits;
    return data;
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
    var hitsTemplate = $('#hitsTemplate').html();
    var emptyTemplate = $('#noResultsTemplate').html();
    this.search.addWidget(instantsearch.widgets.hits({
      container: '#hits',
      hitsPerPage: 40,
      templates: {
        empty: emptyTemplate,
        allItems: hitsTemplate
      },
      transformData: {
        allItems: Sherlock.transformAllHits
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

require.register("test/helper-test", function(exports, require, module) {
'use strict';

var _expect = require('expect');

var _expect2 = _interopRequireDefault(_expect);

var _helper = require('../lib/utils/helper.js');

var _helper2 = _interopRequireDefault(_helper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-env mocha */

describe('Helper', function () {
  describe('splitTextBySentence', function () {
    it('should return the same text if below the limit', function () {
      // Given
      var input = 'Foo bar. Lorem Ipsum.';

      // When
      var actual = _helper2.default.splitTextBySentence(input, 100);

      // Then
      (0, _expect2.default)(actual).toEqual([input]);
    });
    it('should not cut a sentence in half', function () {
      // Given
      var input = 'Foo bar. Lorem Ipsum.';

      // When
      var actual = _helper2.default.splitTextBySentence(input, 5);

      // Then
      (0, _expect2.default)(actual[0]).toEqual('Foo bar.');
      (0, _expect2.default)(actual[1]).toEqual('Lorem Ipsum.');
    });
    it('should not get confuses by several dots if sentence is small enough', function () {
      // Given
      var input = '(Being a reprint from the reminiscences of JOHN H. WATSON, M.D., late of the Army Medical Department.)';

      // When
      var actual = _helper2.default.splitTextBySentence(input);

      // Then
      (0, _expect2.default)(actual).toEqual([input]);
      //
    });
  });
});
});


//# sourceMappingURL=main.js.map