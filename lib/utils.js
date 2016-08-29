'use strict';

const fs = require('fs');
const yaml = require('js-yaml');

/**
 * @description Saves data as a json file
 * @param {String} filename JSON filename
 * @param {Object} data Data to save
 */
function saveJsonFile(filename, data) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

/**
 * @description Saves data as a yaml file
 * @param {String} filename YAML filename
 * @param {Object} data Data to save
 */
function saveYamlFile(filename, data) {
  fs.writeFileSync(filename, yaml.dump(data, {noRefs: true, lineWidth: -1}));
}

/**
 * @description Save an object as a YAML or JSON file
 * @param {String} filename YAML filename
 * @param {format} format File format (json or yaml)
 * @param {Object} data Data to save
 */
function saveFile(filename, format, data) {
  if (format.localeCompare('yaml') === 0) {
    saveYamlFile(filename, data);
  }
  else if (format.localeCompare('json') === 0) {
    saveJsonFile(filename, data);
  }
  else {
    throw new Error('unexpected format ' + format);
  }
}

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'head', 'options', 'patch'];

/**
 * @description Check if a value is a HTTP method
 * @param {String} value The value to check
 * @return {Boolean} True if value is a HTTP method, false otherwise
 */
function isHttpMethod(value) {
  return HTTP_METHODS.indexOf(value) > -1;
}

exports.saveJsonFile = saveJsonFile;
exports.saveYamlFile = saveYamlFile;
exports.saveFile = saveFile;
exports.isHttpMethod = isHttpMethod;
