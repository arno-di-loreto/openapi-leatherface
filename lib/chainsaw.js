'use strict';

const SwaggerParser = require('swagger-parser');
const chain = require('./chain');
const saw = require('./saw');
const async = require('async');

/**
 * @description Checks if inputs is for a single or multiple chainsaw
 * @param {String[]|Object} inputs An array of string limbs or a map of subset:array of string limbs
 * @return {Boolean} True if single, false if not (multiple)
 */
function isSingleChainsaw(inputs) {
  return Array.isArray(inputs);
}

/**
 * @description Create a limbs array from inputs
 * @param {Object} openapi OpenAPI object
 * @param {Object} inputs A map of name:array of string limbs
 * @return {Object[]} Limbs array
 */
function getMultipleLimbs(openapi, inputs) {
  let result = [];
  for (let name in inputs) {
    result.push({
      name: name,
      openapi: openapi,
      limbs: inputs[name]
    });
  }
  return result;
}

/**
 * @description Cuts some limbs of an OpenAPI specification to create a subset
 * @param {Object|String} openapi An OpenAPI object of filename or url
 * @param {String[]} limbs Elements to extract (path, operation, tag)
 * @param {String} name Name which will be used to reference parent file in child file
 * @return {Promise} A promise
 */
function chainsawSingle(openapi, limbs, name) {
  const p = new Promise(function(resolve, reject) {
    if (name === undefined || name === null) {
      name = 'leatherface.json';
    }
    try {
      const childOpenapi =
        saw.getOpenApi(limbs, name, openapi);
      chain.includeDependencies(childOpenapi, name, openapi)
      .then(function(result) {
        resolve(result);
      })
      .catch(function(error) {
        reject(error);
      });
    }
    catch (error) {
      reject(error);
    }
  });
  return p;
}

/**
 * @description Cuts some limbs of an OpenAPI specification to create a subset
 * @param {Object} data Object containing an OpenAPI, limbs and a name
 * @param {Function} callback Callback function
 */
function chainsawMultipleItem(data, callback) {
  const parentOpenapi = data.openapi;
  const limbs = data.limbs;
  const name = data.name;
  chainsawSingle(parentOpenapi, limbs, name)
  .then(function(chilOpenapi) {
    callback(null, {name: name, openapi: chilOpenapi});
  })
  .catch(function(error) {
    callback(error);
  });
}

/**
 * @description Cuts some limbs of an OpenAPI specification to create multiple subsets
 * @param {Object[]} data Array of Object containing an OpenAPI, limbs and a name
 * @return {Promise} A promise
 */
function chainsawMultiple(data) {
  const result = new Promise(function(resolve, reject) {
    async.map(data, chainsawMultipleItem, function(error, openapis) {
      if (error) {
        reject(error);
      }
      else {
        resolve(openapis);
      }
    });
  });
  return result;
}

/**
 * @description Cuts some limbs of an OpenAPI specification to create a subset
 * @param {Object|String} openapi An OpenAPI object of filename or url
 * @param {Object | String[]} inputs Elements to extract An array of string (path, operation, tag) or an object {name: String[]}
 * @return {Promise} A promise
 */
function chainsaw(openapi, inputs) {
  const p = new Promise(function(resolve, reject) {
    const parser = new SwaggerParser();
    parser.parse(openapi)
    .then(function(parentOpenapi) {
      let p2;
      if (isSingleChainsaw(inputs)) {
        p2 = chainsawSingle(parentOpenapi, inputs);
      }
      else {
        p2 = chainsawMultiple(getMultipleLimbs(parentOpenapi, inputs));
      }
      p2.then(function(result) {
        resolve(result);
      }).catch(function(error) {
        reject(error);
      });
    })
    .catch(function(error) {
      reject(error);
    });
  });
  return p;
}

exports._isSingleChainsaw = isSingleChainsaw;
exports._getMultipleLimbs = getMultipleLimbs;
exports._chainsawSingle = chainsawSingle;
exports._chainsawMultipleItem = chainsawMultipleItem;
exports._chainsawMultiple = chainsawMultiple;
exports.chainsaw = chainsaw;
