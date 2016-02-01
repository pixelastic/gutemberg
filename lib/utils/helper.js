import Promise from 'bluebird';
import fs from 'fs';
import jsdom from 'jsdom';
import mkdirp from 'mkdirp';
import stringify from 'json-stable-stringify';
import _ from 'lodash';

const Helper = {
  // Returns a promises fullfilled when the specified dir is created
  createOutputDir(path) {
    return Promise.promisify(mkdirp)(path);
  },
  // Returns a promise fulfilled when correctly reading an HTML file
  readHTML(filepath) {
    let htmlContent = fs.readFileSync(filepath, 'utf-8');
    let jqueryPath = './lib/utils/jquery.js';
    let jquery = fs.readFileSync(jqueryPath, 'utf-8');
    let deferred = Promise.pending();

    jsdom.env({
      html: htmlContent,
      src: [jquery],
      done: (err, window) => {
        if (err) {
          return deferred.reject(err);
        }
        return deferred.resolve(window);
      }
    });

    return deferred.promise;
  },
  // Returns a promise fulfilled when the specified data is written on disk at
  // the specific path
  writeJSON(filepath, data) {
    let promiseWriteFile = Promise.promisify(fs.writeFile);
    let content = stringify(data, {space: '  '});

    return promiseWriteFile(filepath, content)
      .then(() => {
        return data;
      })
      .catch((err) => {
        console.info(`Error when saving file ${filepath}`, err);
      });
  },
  // Return content of a jQuery node
  getNodeContent(element) {
    let content = element.text().trim();
    content = content.replace(/\s\s+/g, ' ');
    return content;
  }

};

export default Helper;
