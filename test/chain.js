'use strict';

const chai = require('chai');
const expect = chai.expect;
const chain = require('../lib/chain');
const SwaggerParser = require('swagger-parser');
const path = require('path');

describe('chain', function() {
  describe('isExternalRef', function() {
    it('should return undefined if the ref is not a reference', function() {
      expect(chain.isExternalRef('noref'),
        'should be undefined for noref').to.be.equal(undefined);
    });
    it('should return undefined if the ref is not a an external reference',
    function() {
      expect(chain.isExternalRef('#/local'),
        'should be undefined for #/local').to.be.equal(undefined);
    });
    it('should return external reference details if extfiles is undefined',
    function() {
      const result = chain.isExternalRef('file.json#/local');
      expect(result, 'should not be undefined for file.json#local')
        .to.be.not.equal(undefined);
      expect(result.externalFile,
        'externalFile should be file.json for file.json#/local')
        .to.be.equal('file.json');
      expect(result.localRef,
        'localRef should be #/local for file.json#/local')
        .to.be.equal('#/local');
    });

    it('should not return detail if externalFile is not in extfiles',
    function() {
      expect(chain.isExternalRef('file.json#/local', ['otherfile.json']))
        .to.be.equal(undefined);
    });

    it('should return detail if externalFile is in extfiles',
    function() {
      const result = chain.isExternalRef('file.json#/local', ['file.json']);
      expect(result, 'unexpected null result').to.be.not.equal(undefined);
      expect(result.externalFile,
        'externalFile should be file.json for file.json#/local')
        .to.be.equal('file.json');
      expect(result.localRef,
        'localRef should be #/local for file.json#/local')
        .to.be.equal('#/local');
    });
  });

  describe('bundle', function() {
    let refs;
    let resolveErr;
    let openapiResult;
    let openapiParent = require('./chain/bundle/parent.json');

    before(function(done) {
      const parser = new SwaggerParser();
      // we could use parser.bundle but referenced object are inlined instead of being copied
      // to relevant sections like definitions, parameters or responses
      parser.resolve(path.join(__dirname, '/chain/bundle/child.json'))
      .then(function(result) {
        refs = result;
        chain.bundle(refs, 'parent.json');
        openapiResult = refs.get('');
        done();
      })
      .catch(function(error) {
        resolveErr = error;
        done();
      });
    });

    it('should resolve test file', function() {
      expect(resolveErr, 'error on resolve (before)').to.be.equal(undefined);
    });

    it('should bundle direct references', function() {
      expect(openapiResult.definitions.Something)
        .to.be.eql(openapiParent.definitions.Something);
    });

    it('should bundle indirect references', function() {
      expect(openapiResult.definitions.SomethingElse)
        .to.be.eql(openapiParent.definitions.SomethingElse);
    });

    it('should not bundle file not in extfiles', function() {
      expect(openapiResult.paths['/path'].get.responses['500'].$ref)
        .to.be.equal('other.json#/responses/ServerError');
    });
  });

  describe('includeDependencies', function() {
    const childFilename = './chain/includeDependencies/child.json';
    const parentFilename = './chain/includeDependencies/parent.json';

    describe('Invalid parent filename', function() {
      let err;
      const parentOpenapi = require(parentFilename);
      const childOpenapi = require(childFilename);

      before(function(done) {
        chain.includeDependencies(
          childOpenapi,
          '..',
          parentOpenapi)
        .then(function() {
          done();
        })
        .catch(function(error) {
          err = error;
          done();
        });
      });

      it('should return an error if parent filename is invalid',
      function() {
        expect(err).to.be.not.equal(undefined);
      });
    });

    describe('Invalid child OpenAPI', function() {
      let err;
      const parentOpenapi = require(parentFilename);
      const childOpenapi = {dummy: 'object'};

      before(function(done) {
        chain.includeDependencies(
          childOpenapi,
          '/leather/face/parent.json',
          parentOpenapi)
        .then(function() {
          done();
        })
        .catch(function(error) {
          err = error;
          done();
        });
      });

      it('should return an error if child is not an openapi object',
      function() {
        expect(err).to.be.not.equal(undefined);
      });
    });

    describe('Invalid parent OpenAPI', function() {
      let err;
      const parentOpenapi = {dummy: 'object'};
      const childOpenapi = require(childFilename);

      before(function(done) {
        chain.includeDependencies(
          childOpenapi,
          '/leather/face/parent.json',
          parentOpenapi)
        .then(function() {
          done();
        })
        .catch(function(error) {
          err = error;
          done();
        });
      });

      it('should return an error if child is not an openapi object',
      function() {
        expect(err).to.be.not.equal(undefined);
      });
    });

    describe('Valid parent and child OpenAPI', function() {
      let openapi;
      let err;
      const parentOpenapi = require(parentFilename);
      const childOpenapi = require(childFilename);

      before(function(done) {
        chain.includeDependencies(
          childOpenapi,
          '/leather/face/parent.json',
          parentOpenapi)
        .then(function(result) {
          openapi = result;
          done();
        })
        .catch(function(error) {
          err = error;
          done();
        });
      });

      it('should run without error', function() {
        expect(err, 'unexpected error').to.be.equal(undefined);
        expect(openapi, 'openapi result is null').to.be.not.equal(null);
      });

      it('should include direct references', function() {
        expect(openapi.parameters.filter, 'parameters.filter')
            .to.be.eql(parentOpenapi.parameters.filter);
        expect(openapi.responses.ServerError, 'responses.ServerError')
            .to.be.eql(parentOpenapi.responses.ServerError);
        expect(openapi.definitions.Something, 'definitions.Something')
            .to.be.eql(parentOpenapi.definitions.Something);
      });

      it('should include indirect references', function() {
        expect(openapi.definitions.Error, 'definitions.Error')
            .to.be.eql(parentOpenapi.definitions.Error);
        expect(openapi.definitions.SomethingElse, 'definitions.SomethingElse')
            .to.be.eql(parentOpenapi.definitions.SomethingElse);
      });

      it('should not include non required elements', function() {
        expect(openapi.parameters.something, 'parameters.something')
            .to.be.equal(undefined);
        expect(openapi.responses.UserError, 'responses.UserError')
            .to.be.equal(undefined);
        expect(openapi.definitions.SomethingWrite, 'definitions.SomethingWrite')
            .to.be.equal(undefined);
      });
    });
  });
});
