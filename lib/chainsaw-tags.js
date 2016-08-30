'use strict';

const SwaggerParser = require('swagger-parser');
const limbs = require('./limbs');
const chainsaw = require('./chainsaw');
const urlify = require('urlify').create({
  toLower: true,
  spaces: '-'
});

/**
 * @description MultitagsOperationsError
 * @param {String} message Error message
 * @param {Object[]} operations List of multitags operations
 */
function MultitagsOperationsError(message, operations) {
  this.name = 'MultitagsOperationsError';
  this.message = (message || '');
  this.operations = operations;
}
MultitagsOperationsError.prototype = Error.prototype;

/**
 * @description Return multi tags operations
 * @param {Object} openapi An OpenAPI object
 * @param {Boolean} [multitagsError=false] Error if multitags operations
 * @return {Object[]} List of multitags operations
 */
function getMultitagsOperations(openapi, multitagsError) {
  const multitags = limbs.getMultitagsOperations(openapi);
  if (multitagsError === true && multitags.length > 0) {
    throw new MultitagsOperationsError(
      'Multitags operations found', multitags);
  }
  return multitags;
}

/**
 * @description NotagOperationsError
 * @param {String} message Error message
 * @param {Object[]} operations List of operations without tags
 */
function NotagOperationsError(message, operations) {
  this.name = 'NotagOperationsError';
  this.message = (message || '');
  this.operations = operations;
}
NotagOperationsError.prototype = Error.prototype;

/**
 * @description Return operations without tag
 * @param {Object} openapi An OpenAPI object
 * @param {Boolean} [notagError=false] Error if operations without tag
 * @return {Object[]} List of operations without tag
 */
function getNotagOperations(openapi, notagError) {
  const notag = limbs.getNotagOperations(openapi);
  if (notagError === true && notag.length > 0) {
    throw new NotagOperationsError('No tag operations found', notag);
  }
  return notag;
}

/**
 * @description Gets limbs to split openapi based on tags
 * @param {Object} openapi An OpenAPI object
 * @param {Object} configuration Split configurations
 * @param {Boolean} [configuration.multitagsError=false] Error if multitags operations
 * @param {Boolean} [configuration.notagError=false] Error if operations without tag
 * @param {Boolean} [configuration.includeNotag=true] Include operations without tag
 * @param {String} [configuration.notagName=default] No tag name
 * @return {String[]} Limbs for chainsaw
 */
function getLimbs(openapi, configuration) {
  if (configuration === undefined || configuration === null) {
    configuration = {
      multitagsError: undefined,
      notagError: undefined,
      includeNotag: true,
      notagName: undefined
    };
  }
  let defaultName = configuration.notagName;
  if (defaultName === undefined || defaultName === null) {
    defaultName = 'default';
  }
  getMultitagsOperations(openapi, configuration.multitagsError);
  const notags = getNotagOperations(openapi, configuration.notagError);
  const tags = limbs.getTags(openapi);
  const result = {};
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const filename = urlify(tag);
    result[filename] = [tag];
  }
  if (configuration.includeNotag && notags.length > 0) {
    result[defaultName] = [];
    for (let i = 0; i < notags.length; i++) {
      const operation = notags[i];
      result[defaultName].push(operation.method + ' ' + operation.path);
    }
  }
  return result;
}

/**
 * @description Splits an open api in multiple files: each file containg operation for a single tag
 * @param {Object|String} openapi An OpenAPI object of filename or url
 * @param {Object} configuration Split configurations
 * @param {Boolean} [configuration.multitagsError=true] Error if multitags operations
 * @param {Boolean} [configuration.notagError=false] Error if operations without tag
 * @param {Boolean} [configuration.includeNotag=true] Include operations without tag
 * @param {String} [configuration.notagName=default] No tag name
 * @return {Promise} A promise
 */
function chainsawTags(openapi, configuration) {
  const p = new Promise(function(resolve, reject) {
    const parser = new SwaggerParser();
    parser.parse(openapi)
    .then(function(parentOpenapi) {
      try {
        const chainsawLimbs = getLimbs(parentOpenapi, configuration);
        chainsaw.chainsaw(parentOpenapi, chainsawLimbs)
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
    })
    .catch(function(error) {
      reject(error);
    });
  });
  return p;
}

exports._getMultitagsOperations = getMultitagsOperations;
exports._getNotagOperations = getNotagOperations;
exports._getLimbs = getLimbs;
exports.chainsawTags = chainsawTags;


chainsawTags('http://apidoc.devops-axb.com/axabanque_api.yaml');
