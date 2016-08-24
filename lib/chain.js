'use strict';

const SwaggerParser = require('swagger-parser');
const mock = require('mock-fs');
const fs = require('fs');
const mkdirp = require('mkdirp');
const saw = require('./saw');

/**
 * @description Returns external refs details et the passed ref is as external one and.
 * @param {String} ref The reference
 * @param {String[]} [extfiles] Filters on selectef files
 * @return {Object} Reference details ({ externalRef: value, localRef: value})
 */
function isExternalRef(ref, extfiles) {
  let result;
  const split = ref.split('#');
  if (split.length === 2 &&
      split[0].length > 0 &&
    (extfiles === undefined ||
      extfiles === null ||
      extfiles.length === 0 ||
      extfiles.indexOf(split[0]) > -1)) {
    result = {
      fullRef: ref,
      externalFile: split[0],
      localRef: '#' + split[1]
    };
  }
  return result;
}

/**
 * @description True bundle: copying external references into OpenAPI object in the correct sections.
 * Only standard ones are handled for now (definitions, parameters and responses).
 * @param {Object} refs References returned by SwaggerParser.resolve
 * @param {String[]} extfiles Only process these external referenced files
 * @param {Object} object The current object to process (for recursivity)
 */
function bundle(refs, extfiles, object) {
  if (object === undefined) {
    object = refs.get('');
  }

  for (let property in object) {
    if (property.localeCompare('$ref') === 0) {
      const ref = object[property];
      const refDetails = isExternalRef(ref, extfiles);
      if (refDetails !== undefined) {
        const refObject = refs.get(refDetails.fullRef);
        // we need to update $ref in object and bundle it, if not we will not get child objects
        saw.updateRefs(refDetails.externalFile, refObject);
        bundle(refs, extfiles, refObject);
        // update ref to point local one
        object[property] = refDetails.localRef;
        // add referenced object
        const path = refDetails.localRef;
        refs.set(path, refObject);
      }
    }
    else if (typeof object[property] === 'object') {
      bundle(refs, extfiles, object[property]);
    }
  }
}

/**
 * @description Includes all necessary dependencies into child from parent
 * @param {Object} childOpenapi Child OpenAPI object produces with saw.getOpenApi
 * @param {String} parentOpenapiFilename Filename used in child's $refs
 * @param {Object} parentOpenapi Parent OpenAPI from which the child has been produced
 * @return {Object} Child OpenAPI object enhanced with its dependencies
 */
function includeDependencies(
  childOpenapi, parentOpenapiFilename, parentOpenapi) {
  let p = new Promise(function(resolve, reject) {
    // using mockfs because we need to provide easy access to referenced parent file even within a browser
    // UPGRADE: use a custom resolver to avoid this?
    mock({});
    try {
      mkdirp.sync(
          parentOpenapiFilename.substr(
            0,
            parentOpenapiFilename.lastIndexOf('/')));
      fs.writeFileSync(
        parentOpenapiFilename, JSON.stringify(parentOpenapi));
    }
    catch (error) {
      mock.restore();
      reject(error);
    }
    const parser = new SwaggerParser();
    // we could use parser.bundle but referenced object are inlined instead of being copied
    // to relevant sections like definitions, parameters or responses
    parser.resolve(childOpenapi)
    .then(function(refs) {
      bundle(refs, [parentOpenapiFilename]);
      mock.restore();
      resolve(childOpenapi);
    })
    .catch(function(error) {
      mock.restore();
      reject(error);
    });
  });
  return p;
}

exports.isExternalRef = isExternalRef;
exports.bundle = bundle;
exports.includeDependencies = includeDependencies;
/*
const parentOpenapi = require('../test/chain/parent.json');
console.log('PARENT', JSON.stringify(parentOpenapi, null, 2));
const childOpenapi = require('../test/chain/child.json');
console.log('BEFORE', JSON.stringify(childOpenapi, null, 2));
includeDependencies(childOpenapi, '/leather/face/parent.json', parentOpenapi)
.then(function(result) {
  console.log('AFTER', JSON.stringify(result, null, 2));
})
.catch(function(error) {
  console.log('ERROR', error);
});
*/
