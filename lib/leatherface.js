'use strict';

const SwaggerParser = require('swagger-parser');
const chain = require('./chain');
const saw = require('./saw');

/**
 * @description Cuts some limbs of an OpenAPI specification to create a subset
 * @param {Object|String} openapi An OpenAPI object of filename or url
 * @param {String[]} limbs Elements to extract (path, operation, tag)
 * @return {Promise} A promise
 */
function chainsaw(openapi, limbs) {
  const p = new Promise(function(resolve, reject) {
    const parser = new SwaggerParser();
    parser.parse(openapi)
    .then(function(parentOpenapi) {
      const childOpenapi =
        saw.getOpenApi(limbs, 'parent.json', parentOpenapi);
      chain.includeDependencies(childOpenapi, 'parent.json', parentOpenapi)
      .then(function(chilOpenapiWithDependencies) {
        resolve(chilOpenapiWithDependencies);
      })
      .catch(function(error) {
        reject(error);
      });
    })
    .catch(function(error) {
      reject(error);
    });
  });
  return p;
}

exports.chainsaw = chainsaw;
