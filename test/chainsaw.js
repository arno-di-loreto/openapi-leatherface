'use strict';

const chai = require('chai');
const expect = chai.expect;
const chainsaw = require('../lib/chainsaw');

describe('chainsaw', function() {
  describe('isSingleChainsaw', function() {
    it('should return true if inputs is single chainsaw parameter', function() {
      expect(chainsaw._isSingleChainsaw(['get /something'])).to.be.equal(true);
    });

    it('should return false if inputs is multiple chainsaw parameter',
    function() {
      expect(chainsaw._isSingleChainsaw(
        {one: ['get /something'], two: ['get /something']}))
      .to.be.equal(false);
    });
  });

  describe('getMultipleLimbs', function() {
    it('should return an array of limbs with name, limbs and openapi',
    function() {
      const openapi = {dummy: 'openapi'};
      const inputs = {
        one: ['get /path'],
        two: ['tag']
      };
      const result = chainsaw._getMultipleLimbs(openapi, inputs);
      expect(result.length).to.be.equal(2);
      expect(result[0].name).to.be.equal('one');
      expect(result[0].limbs).to.be.eql(inputs.one);
      expect(result[0].openapi).to.be.eql(openapi);
      expect(result[1].name).to.be.equal('two');
      expect(result[1].limbs).to.be.eql(inputs.two);
      expect(result[1].openapi).to.be.eql(openapi);
    });
  });

  describe('chainsawSingle', function() {
    const parentOpenapi = require('./chainsaw/parent.json');
    let childOpenapi;
    let chainsawErr;
    describe('OK without name', function() {
      before(function(done) {
        chainsaw._chainsawSingle(parentOpenapi, ['get /path'])
        .then(function(result) {
          childOpenapi = result;
          done();
        })
        .catch(function(error) {
          chainsawErr = error;
          done();
        });
      });

      it('should not return an error', function() {
        expect(chainsawErr).to.be.equal(undefined);
      });

      it('should return a child OpenAPI with only get /path', function() {
        const operations = [];
        for (let path in childOpenapi.paths) {
          for (let httpMethod in childOpenapi.paths[path]) {
            operations.push(httpMethod + ' ' + path);
          }
        }
        expect(operations.length, 'unexpected operation').to.be.equal(1);
        expect(operations[0], 'wrong operation').to.be.equal('get /path');
        expect(childOpenapi.paths['/path'].get)
          .to.be.eql(parentOpenapi.paths['/path'].get);
      });

      it('should return only needed parameters', function() {
        const parameters = ['filter'];
        for (let parameter in childOpenapi.parameters) {
          expect(parameters.indexOf(parameter) > -1,
            'unexpected parameter ' + parameter)
              .to.be.equal(true);
          expect(childOpenapi.parameters[parameter],
            'unexpected content for parameter ' + parameter)
          .to.be.eql(parentOpenapi.parameters[parameter]);
        }
      });

      it('should return only needed responses', function() {
        const responses = ['ServerError'];
        for (let response in childOpenapi.responses) {
          expect(responses.indexOf(response) > -1,
            'unexpected response ' + response)
              .to.be.equal(true);
          expect(childOpenapi.responses[response],
        'unexpected content for response ' + response)
          .to.be.eql(parentOpenapi.responses[response]);
        }
      });

      it('should return only needed definitions', function() {
        const definitions = ['Something', 'SomethingElse', 'Error'];
        for (let definition in childOpenapi.definitions) {
          expect(definitions.indexOf(definition) > -1,
            'unexpected definition ' + definition)
              .to.be.equal(true);
          expect(childOpenapi.definitions[definition],
            'unexpected content for definition ' + definition)
              .to.be.eql(parentOpenapi.definitions[definition]);
        }
      });
    });

    describe('OK with a name', function() {
      before(function(done) {
        chainsaw._chainsawSingle(parentOpenapi, ['get /path'], 'aname.json')
        .then(function(result) {
          childOpenapi = result;
          done();
        })
        .catch(function(error) {
          chainsawErr = error;
          done();
        });
      });

      it('should not return an error', function() {
        expect(chainsawErr).to.be.equal(undefined);
      });
    });

    describe('KO on getOpenApi', function() {
      const parentOpenapi = require('./chainsaw/parent.json');
      before(function(done) {
        chainsaw._chainsawSingle(parentOpenapi, ['get /nopath'])
        .then(function(result) {
          childOpenapi = result;
          done();
        })
        .catch(function(error) {
          chainsawErr = error;
          done();
        });
      });

      it('should return an error', function() {
        expect(chainsawErr).to.be.not.equal(undefined);
      });
    });

    describe('KO on includeDependencies', function() {
      const parentOpenapi =
        require('./chainsaw/parent-unknown-dependencies.json');
      let chainsawSingleResult;
      let chainsawErr;

      before(function(done) {
        chainsaw._chainsawSingle(parentOpenapi, ['get /path'])
        .then(function(result) {
          chainsawSingleResult = result;
          done();
        })
        .catch(function(error) {
          chainsawErr = error;
          done();
        });
      });

      it('should return an error', function() {
        expect(chainsawErr, 'error should not be null').to.be.not.equal(undefined);
      });

      it('should not return a child OpenApi', function() {
        expect(chainsawSingleResult, 'unexpected child OpenAPI')
          .to.be.equal(undefined);
      });
    });
  });

  describe('chainsawMultipleItem', function() {
    describe('OK', function() {
      const parentOpenapi = require('./chainsaw/parent.json');
      let chainsawMultipleItemResult;
      let chainsawErr;
      let expectedChildOpenapi;

      before(function(done) {
        chainsaw._chainsawMultipleItem(
          {name: 'aname.json', openapi: parentOpenapi, limbs: ['get /path']},
          function(error, result) {
            chainsawMultipleItemResult = result;
            chainsawErr = error;
            done();
          });
      });

      before(function(done) {
        chainsaw._chainsawSingle(parentOpenapi, ['get /path'], 'aname.json')
        .then(function(result) {
          expectedChildOpenapi = result;
          done();
        });
      });

      it('should not return an error', function() {
        expect(chainsawErr).to.be.equal(null);
      });

      it('should not a child OpenApi', function() {
        expect(chainsawMultipleItemResult.openapi,
          'unexpected result.openapi content')
            .to.be.be.eql(expectedChildOpenapi);
        expect(chainsawMultipleItemResult.name,
          'unexpected result.name content')
          .to.be.be.eql('aname.json');
      });
    });

    describe('KO', function() {
      const parentOpenapi = require('./chainsaw/parent.json');
      let chainsawMultipleItemResult;
      let chainsawErr;
      before(function(done) {
        chainsaw._chainsawMultipleItem(
          {name: 'aname.json', openapi: parentOpenapi, limbs: ['get /nopath']},
          function(error, result) {
            chainsawMultipleItemResult = result;
            chainsawErr = error;
            done();
          });
      });

      it('should return an error', function() {
        expect(chainsawErr, 'error should not be null').to.be.not.equal(null);
      });

      it('should not return a child OpenApi', function() {
        expect(chainsawMultipleItemResult, 'unexpected child OpenAPI')
          .to.be.equal(undefined);
      });
    });
  });

  describe('chainsawMultiple', function() {
    describe('OK', function() {
      const parentOpenapi = require('./chainsaw/parent.json');
      let chainsawMultipleResult;
      let chainsawErr;
      let chainsawMultipleExpectedResult;

      before(function(done) {
        chainsaw._chainsawMultiple(
          [{name: 'aname.json', openapi: parentOpenapi, limbs: ['get /path']}])
        .then(function(result) {
          chainsawMultipleResult = result;
          done();
        })
        .catch(function(error) {
          chainsawErr = error;
          done();
        });
      });

      before(function(done) {
        chainsaw._chainsawMultipleItem(
          {name: 'aname.json', openapi: parentOpenapi, limbs: ['get /path']},
          function(error, result) {
            chainsawMultipleExpectedResult = [result];
            done();
          });
      });

      it('shoud not return an error', function() {
        expect(chainsawErr).to.be.equal(undefined);
      });

      it('should return an array with correct result', function() {
        expect(chainsawMultipleResult)
          .to.be.eql(chainsawMultipleExpectedResult);
      });
    });

    describe('KO', function() {
      const parentOpenapi = require('./chainsaw/parent.json');
      let chainsawErr;
      before(function(done) {
        chainsaw._chainsawMultiple(
          [{name: 'aname.json', openapi: parentOpenapi, limbs: ['get /nopath']}])
        .then(function() {
          done();
        })
        .catch(function(error) {
          chainsawErr = error;
          done();
        });
      });

      it('shoud not return an error', function() {
        expect(chainsawErr).to.be.not.equal(undefined);
      });
    });
  });

  describe('chainsaw', function() {
    describe('KO on parsing', function() {
      let childOpenapi;
      let parseError;
      before(function(done) {
        chainsaw.chainsaw('nofile.yaml', [])
        .then(function(result) {
          childOpenapi = result;
          done();
        })
        .catch(function(error) {
          parseError = error;
          done();
        });
      });

      it('should have return parsing error', function() {
        expect(parseError, 'parseError should not be undefined')
          .to.be.not.equal(undefined);
        expect(childOpenapi, 'childOpenapi should be undefined')
          .to.be.equal(undefined);
      });
    });

    describe('KO on sawing', function() {
      let childOpenapi;
      let parseError;
      const parentOpenapi = require('./chainsaw/parent.json');
      before(function(done) {
        chainsaw.chainsaw(parentOpenapi, ['get /nopath'])
        .then(function(result) {
          childOpenapi = result;
          done();
        })
        .catch(function(error) {
          parseError = error;
          done();
        });
      });

      it('should have return parsing error', function() {
        expect(parseError, 'parseError should not be undefined')
          .to.be.not.equal(undefined);
        expect(childOpenapi, 'childOpenapi should be undefined')
          .to.be.equal(undefined);
      });
    });

    describe('Cutting operation limb (single)', function() {
      let childOpenapi;
      let parseError;
      const parentOpenapi = require('./chainsaw/parent.json');
      before(function(done) {
        chainsaw.chainsaw(parentOpenapi, ['get /path'])
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

    describe('Cutting operation limb (multiple)', function() {
      let childOpenapis;
      let parseError;
      const parentOpenapi = require('./chainsaw/parent.json');
      before(function(done) {
        chainsaw.chainsaw(parentOpenapi, {aname: ['get /path']})
        .then(function(result) {
          childOpenapis = result;
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
        expect(childOpenapis, 'childOpenapi should not be undefined')
          .to.be.not.equal(undefined);
      });

      it('should return multiple results', function() {
        expect(childOpenapis.length).to.be.equal(1);
      });
    });
  });
});
