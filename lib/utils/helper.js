import Promise from 'bluebird';
import crypto from 'crypto';
import fs from 'fs';
import glob from 'glob';
import jsdom from 'jsdom';
import jsonfile from 'jsonfile';
import mkdirp from 'mkdirp';
import stringify from 'json-stable-stringify';

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
  // Returns a promise fullfilled when reading the specified json file
  readJSON(filepath) {
    let promiseReadFile = Promise.promisify(jsonfile.readFile);
    return promiseReadFile(filepath);
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
  // Returns a promise fulfilled with all the filepath matching
  getFilelist(pattern) {
    return Promise.promisify(glob)(pattern);
  },
  // Return content of a jQuery node
  getNodeContent(element) {
    // Replace HTML new lines with spaces
    element.find('br').replaceWith(' ');
    let content = element.text().trim();
    // Replace real new lines with spaces
    content = content.replace(/\n/g, ' ');
    // Remove spaces
    content = content.replace(/\s\s+/g, ' ');
    return content;
  },
  // Return a reproducible, unique id for any given element
  getUniqueID(element) {
    let elementHash = [
      element.author,
      element.book,
      element.chapterOrder,
      element.order,
      element.content
    ].join('-');
    return crypto.createHash('md5').update(elementHash).digest('hex');
  }

};

export default Helper;
