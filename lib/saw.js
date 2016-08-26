'use strict';

const clone = require('clone');

const DEFAULT_PROPERTIES = [
  'swagger',
  'info',
  'host',
  'basePath',
  'schemes',
  'consumes',
  'produces',
  'securityDefinitions',
  'security',
  'tags',
  'externalDocs',
  /x-.*/
];

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'head', 'options', 'path'];

/**
 * @description Gets unique properties names
 * @param {Object} source Source object
 * @param {Array.<String|Regexp>} properties Properties names
 * @return {Object} Object with copied properties
 */
function getPropertiesNames(source, properties) {
  const result = [];
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    if (typeof property === 'string') {
      if (result.indexOf(property) < 0) {
        result.push(property);
      }
    }
    else {
      for (let name in source) {
        if (name.match(property) && result.indexOf(property) < 0) {
          result.push(name);
        }
      }
    }
  }
  return result;
}

/**
 * @description Copy some properties from an existing object to a new one
 * @param {Object} source Source object
 * @param {Array.<String|Regexp>} properties Properties names
 * @return {Object} Object with copied properties
 */
function copyProperties(source, properties) {
  const result = {};
  const allProperties = getPropertiesNames(source, properties);
  for (let i = 0; i < allProperties.length; i++) {
    const property = allProperties[i];
    if (source.hasOwnProperty(property)) {
      result[property] = source[property];
    }
  }
  return result;
}

/**
 * @description Extract some operations from an OpenAPI specifications
 * @param {String[]} operations Operation to extract
 * @param {Object} openapi OpenAPI specification
 * @return {Object} Subset of the API specification
 */
function extractOperations(operations, openapi) {
  const result = {};
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i].split(' ');
    const method = operation[0];
    const path = operation[1];
    if (!result.hasOwnProperty(path)) {
      result[path] = copyProperties(
        openapi.paths[path], ['parameters', /x-.*/]);
    }
    result[path][method] = openapi.paths[path][method];
  }
  return result;
}

/**
 * @description Update all local $ref to add origin filename
 * @param {String} filename Filename added to each $ref
 * @param {Object} object The object to process
 * @param {String[]} extfiles Only process these external referenced files
 */
function updateRefs(filename, object) {
  for (let property in object) {
    if (property.localeCompare('$ref') === 0 &&
        object[property].startsWith('#')) {
      object[property] = filename + object[property];
    }
    else if (typeof object[property] === 'object') {
      updateRefs(filename, object[property]);
    }
  }
}

/**
 * @description Checks if an object corresponding to a value in OpenAPI object is a path
 * @param {String} value The value
 * @param {Object} openapi The OpenAPI object
 * @return {Boolean} True if a path, false otherwise
 */
function isPath(value, openapi) {
  return openapi.paths.hasOwnProperty(value) && value.startsWith('/');
}

/**
 * @description Checks if an object corresponding to a value in OpenAPI object is an operation
 * @param {String} value The value
 * @param {Object} openapi The OpenAPI object
 * @return {Boolean} True if an operation, false otherwise
 */
function isOperation(value, openapi) {
  let result = false;
  const split = value.split(' ');
  if (split.length === 2) {
    const method = split[0];
    const path = split[1];
    if (isPath(path, openapi) &&
      HTTP_METHODS.indexOf(method) >= 0 &&
      openapi.paths[path].hasOwnProperty(method)) {
      result = true;
    }
  }
  return result;
}

/**
 * @description Checks if an object corresponding to a value in OpenAPI object is a tag
 * @param {String} value The value
 * @param {Object} openapi The OpenAPI object
 * @return {Boolean} True if a tag, false otherwise
 */
function isTag(value, openapi) {
  let result = false;
  for (let path in openapi.paths) {
    const pathObject = openapi.paths[path];
    for (let method in pathObject) {
      if (HTTP_METHODS.indexOf(method) > -1 &&
        pathObject[method].hasOwnProperty('tags') &&
        pathObject[method].tags.indexOf(value) > -1) {
        result = true;
        break;
      }
    }
  }
  return result;
}

/**
 * @description Returns all operations for a path in an OpenAPI object
 * @param {String} path The path
 * @param {Object} openapi The OpenAPI object
 * @return {String[]} List of operations
 */
function getOperationsForPath(path, openapi) {
  const result = [];
  if (openapi.paths[path]) {
    for (let method in openapi.paths[path]) {
      if (HTTP_METHODS.indexOf(method) > -1) {
        result.push(method + ' ' + path);
      }
    }
  }
  else {
    throw new Error('Unknown path ' + path);
  }
  return result;
}

/**
 * @description Returns all operations for a tag in an OpenAPI object
 * @param {String} tag The tag
 * @param {Object} openapi The OpenAPI object
 * @return {String[]} List of operations
 */
function getOperationsForTag(tag, openapi) {
  const result = [];
  for (let path in openapi.paths) {
    const pathObject = openapi.paths[path];
    for (let method in pathObject) {
      if (HTTP_METHODS.indexOf(method) > -1 &&
        pathObject[method].hasOwnProperty('tags') &&
        pathObject[method].tags.indexOf(tag) > -1) {
        result.push(method + ' ' + path);
      }
    }
  }
  if (result.length === 0) {
    throw new Error('No operation for tag ' + tag);
  }
  return result;
}

/**
 * @description Returns all operations for params (tag, path, operation) in an OpenAPI object
 * @param {String[]} params List of params
 * @param {Object} openapi The OpenAPI object
 * @return {String[]} List of operations
 */
function getOperations(params, openapi) {
  let result = [];
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    if (isOperation(param, openapi)) {
      result.push(param);
    }
    else if (isPath(param, openapi)) {
      const ops = getOperationsForPath(param, openapi);
      result = result.concat(ops);
    }
    else if (isTag(param, openapi)) {
      result = result.concat(getOperationsForTag(param, openapi));
    }
    else {
      throw new Error('No tag, operation or tag matches limb ' + param);
    }
  }
  return result;
}

/**
 * @description Returns an OpenAPI object without paths, definitions, responses and parameters
 * @param {Object} openapi The OpenAPI object
 * @return {Object} New (incomplete) OpenAPI object
 */
function getAllDataExceptPathsAnDefinitions(openapi) {
  return copyProperties(openapi, DEFAULT_PROPERTIES);
}

/**
 * @description Returns an OpenAPI object containing a subset of operations
 * from a source OpenAPI object (all $ref pointing to <filename><$ref value>)
 * @param {String[]} params Elements to extract(path, operation, tag)
 * @param {String} filename Filename to add to $ref
 * @param {Object} openapi Source OpenAPI object
 * @return {Object} New OpenAPI object
 */
function getOpenApi(params, filename, openapi) {
  const clonedParent = clone(openapi);
  const result = getAllDataExceptPathsAnDefinitions(clonedParent);
  const operations = getOperations(params, clonedParent);
  result.paths = extractOperations(operations, clonedParent);
  updateRefs(filename, result);
  return result;
}

exports.getPropertiesNames = getPropertiesNames;
exports.copyProperties = copyProperties;
exports.extractOperations = extractOperations;
exports.updateRefs = updateRefs;
exports.isPath = isPath;
exports.isOperation = isOperation;
exports.isTag = isTag;
exports.getOperationsForPath = getOperationsForPath;
exports.getOperationsForTag = getOperationsForTag;
exports.getOperations = getOperations;
exports.getAllDataExceptPathsAnDefinitions = getAllDataExceptPathsAnDefinitions;
exports.getOpenApi = getOpenApi;
