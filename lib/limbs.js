'use strict';

const utils = require('./utils');

/**
 * @description Returns tag limbs with their operations
 * @param {Object} openapi An OpenAPI Object
 * @return {Object} A tag/operations map
 */
function getTagsOperations(openapi) {
  const map = {};

  for (let path in openapi.paths) {
    const pathObject = openapi.paths[path];
    for (let httpMethod in pathObject) {
      if (utils.isHttpMethod(httpMethod)) {
        const operationObject = pathObject[httpMethod];
        let tags;
        if (operationObject.hasOwnProperty('tags')) {
          tags = operationObject.tags;
          for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];
            if (!map.hasOwnProperty(tag)) {
              map[tag] = [];
            }
            const operation = {
              method: httpMethod,
              path: path,
              multitags: tags.length > 1
            };
            map[tag].push(operation);
          }
        }
      }
    }
  }
  const result = [];
  for (let tag in map) {
    result.push({
      tag: tag,
      operations: map[tag]
    });
  }
  return result;
}

/**
 * @description Returns operations without tag
 * @param {Object} openapi An OpenAPI Object
 * @return {Object} An operation array (method, path)
 */
function getNotagOperations(openapi) {
  const result = [];
  for (let path in openapi.paths) {
    const pathObject = openapi.paths[path];
    for (let httpMethod in pathObject) {
      if (utils.isHttpMethod(httpMethod)) {
        const operationObject = pathObject[httpMethod];
        if (!operationObject.hasOwnProperty('tags')) {
          const operation = {
            method: httpMethod,
            path: path
          };
          result.push(operation);
        }
      }
    }
  }
  return result;
}

/**
 * @description Returns multi tags operations
 * @param {Object} openapi An OpenAPI Object
 * @return {Object} A list of multi-tags operations
 */
function getMultitagsOperations(openapi) {
  const result = [];
  for (let path in openapi.paths) {
    const pathObject = openapi.paths[path];
    for (let httpMethod in pathObject) {
      if (utils.isHttpMethod(httpMethod)) {
        const operationObject = pathObject[httpMethod];
        let tags;
        if (operationObject.hasOwnProperty('tags')) {
          tags = operationObject.tags;
          if (tags.length > 1) {
            result.push({
              method: httpMethod,
              path: path,
              tags: operationObject.tags
            });
          }
        }
      }
    }
  }
  return result;
}

/**
 * @description returns OpenAPI's tags
 * @param {Object} openapi An OpenAPI object
 * @return {String[]} A list of tags
 */
function getTags(openapi) {
  const result = [];
  const tags = getTagsOperations(openapi);
  for (let i = 0; i < tags.length; i++) {
    result.push(tags[i].tag);
  }
  return result;
}

exports.getTagsOperations = getTagsOperations;
exports.getNotagOperations = getNotagOperations;
exports.getMultitagsOperations = getMultitagsOperations;
exports.getTags = getTags;
