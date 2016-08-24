'use strict';

const chai = require('chai');
const expect = chai.expect;
const leatherface = require('../lib/leatherface');

describe('leatherface', function() {
  describe('chainsaw', function() {
    describe('KO on parsing', function() {
      let childOpenapi;
      let parseError;
      before(function(done) {
        leatherface.chainsaw('nofile.yaml', [])
        .then(function(result) {
          childOpenapi = result;
          done();
        })
        .catch(function(error) {
          parseError = error;
          done();
        });
      });

      it('should have return an error', function() {
        expect(parseError, 'parseError should not be undefined')
          .to.be.not.equal(undefined);
        expect(childOpenapi, 'childOpenapi should be undefined')
          .to.be.equal(undefined);
      });
    });

    describe('Cutting operation limb', function() {
      let childOpenapi;
      let parseError;
      const parentOpenapi = require('./leatherface/parent.json');
      before(function(done) {
        leatherface.chainsaw(parentOpenapi, ['get /path'])
        .then(function(result) {
          childOpenapi = result;
          done();
        })
        .catch(function(error) {
          parseError = error;
          done();
        });
      });

      it('should not have return an error', function() {
        expect(parseError, 'parseError should not undefined')
          .to.be.equal(undefined);
        expect(childOpenapi, 'childOpenapi should not be undefined')
          .to.be.not.equal(undefined);
      });

      it('should return only get /path', function() {
        const operations = [];
        for (let path in childOpenapi.paths) {
          for (let httpMethod in childOpenapi.paths[path]) {
            operations.push(httpMethod + ' ' + path);
          }
        }
        expect(operations.length, 'unexpected operation').to.be.equal(1);
        expect(operations[0], 'wrong operation').to.be.equal('get /path');
      });
    });
  });
});
