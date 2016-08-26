'use strict';

const chai = require('chai');
const expect = chai.expect;
const saw = require('../lib/saw');

describe('saw', function() {
  describe('getPropertiesNames', function() {
    it('should keep unique string properties', function() {
      const source = {
        some: 'value'
      };
      const properties = ['some', 'some'];
      expect(saw.getPropertiesNames(source, properties))
        .to.be.eql(['some']);
    });
    it('should get regex properties', function() {
      const source = {
        some: 'value',
        someOther: 'value'
      };
      const properties = [/s.*/];
      expect(saw.getPropertiesNames(source, properties))
        .to.be.eql(['some', 'someOther']);
    });
    it('should keep unique names with regex and name',function() {
      const source = {
        some: 'value',
        someOther: 'value'
      };
      const properties = [/s.*/, 'some'];
      expect(saw.getPropertiesNames(source, properties))
        .to.be.eql(['some', 'someOther']);
    });
  });

  describe('copyProperties', function() {
    it('should copy name properties', function() {
      const source = {
        some: 'value'
      };
      const properties = ['some'];
      expect(saw.copyProperties(source, properties).hasOwnProperty('some'),
        'result should have <some> property')
            .to.be.equal(true);
    });

    it('should ignore properties not in the list', function() {
      const source = {
        some: 'value'
      };
      const properties = ['other'];
      expect(saw.copyProperties(source, properties).hasOwnProperty('some'),
        'result should not have <some> property')
            .to.be.equal(false);
    });

    it('should copy property which name matches a regexp', function() {
      const source = {
        some: 'value'
      };
      const properties = [/s.*/];
      expect(saw.copyProperties(source, properties).hasOwnProperty('some'),
        'result should have <some> property')
            .to.be.equal(true);
    });

    it('should copy property which name do not matches a regexp', function() {
      const source = {
        home: 'value'
      };
      const properties = [/s.*/];
      expect(saw.copyProperties(source, properties).hasOwnProperty('home'),
        'result should not have <home> property')
            .to.be.equal(false);
    });
  });

  describe('extractOperations', function() {
    const openapi = {
      paths: {
        '/path': {
          parameters: {some: 'parameters'},
          get: {some: 'operation'},
          post: {other: 'operation'},
          delete: {third: 'operation'},
          'x-custom': {custom: 'value'}
        },
        '/another-path': {
          get: {another: 'operation'}
        }
      }
    };
    let result;
    it('should run withour error', function() {
      try {
        result = saw.extractOperations(
          ['get /path', 'delete /path'], openapi);
      }
      catch (error) {
        expect(error, 'unexpected error').to.be.equal(null);
      }
    });

    it('should return path parameters', function() {
      expect(result['/path'].parameters,
        '/path should have a parameter property')
        .to.be.equal(openapi.paths['/path'].parameters);
    });

    it('should return path x- properties', function() {
      expect(result['/path']['x-custom'],
        '/path should have a x-custom property')
        .to.be.equal(openapi.paths['/path']['x-custom']);
    });

    it('should return selected operations', function() {
      expect(result['/path'].get,
        '/path should have a get operation')
        .to.be.equal(openapi.paths['/path'].get);
      expect(result['/path'].delete,
        '/path should have a delete operation')
        .to.be.equal(openapi.paths['/path'].delete);
    });

    it('should not return not selected operation in /path', function() {
      expect(result['/path'].hasOwnProperty('post'),
        '/path should not have a post operation')
        .to.be.equal(false);
    });

    it('should not return not selected /another-path', function() {
      expect(result.hasOwnProperty('/another-path'),
        '/another-path should not be returned')
        .to.be.equal(false);
    });
  });

  describe('updateRefs', function() {
    it('should update root $ref property', function() {
      const source = {
        $ref: '#/definitions/value'
      };
      saw.updateRefs('openapi.yaml', source);
      expect(source.$ref).to.be.equal('openapi.yaml#/definitions/value');
    });

    it('should update deep $ref property', function() {
      const source = {
        deep: {
          $ref: '#/definitions/value'
        }
      };
      saw.updateRefs('openapi.yaml', source);
      expect(source.deep.$ref).to.be.equal('openapi.yaml#/definitions/value');
    });

    it('should update $ref in array', function() {
      const source = {
        array: [
          {$ref: '#/definitions/value'}
        ]
      };
      saw.updateRefs('openapi.yaml', source);
      expect(source.array[0].$ref)
        .to.be.equal('openapi.yaml#/definitions/value');
    });

    it('should update deep $ref in array', function() {
      const source = {
        array: [
          {deep: {$ref: '#/definitions/value'}}
        ]
      };
      saw.updateRefs('openapi.yaml', source);
      expect(source.array[0].deep.$ref)
        .to.be.equal('openapi.yaml#/definitions/value');
    });

    it('should not update other values', function() {
      const source = {
        some: 'value'
      };
      saw.updateRefs('openapi.yaml', source);
      expect(source.some).to.be.equal('value');
    });

    it('should update only local ref', function() {
      const source = {
        $ref: 'file.json#/definitions/value'
      };
      saw.updateRefs('openapi.yaml', source);
      expect(source.$ref).to.be.equal('file.json#/definitions/value');
    });
  });

  describe('isPath', function() {
    it('should return true for a path', function() {
      const openapi = {
        paths: {
          '/path': {some: 'value'}
        }
      };
      expect(saw.isPath('/path', openapi),
        '/path should be a path').to.be.equal(true);
    });

    it('should return false if in paths but not a path', function() {
      const openapi = {
        paths: {
          parameters: {some: 'value'},
          'x-custom': {some: 'value'}
        }
      };
      expect(saw.isPath('parameters', openapi),
        'parameters should not be a path').to.be.equal(false);
      expect(saw.isPath('x-custom', openapi),
        'x-custom should not be a path').to.be.equal(false);
    });
  });

  describe('isOperation', function() {
    it('should return true if an operation', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {some: 'value'}
          }
        }
      };
      expect(saw.isOperation('get /path', openapi),
        'get /path should be an operation').to.be.equal(true);
    });

    it('should return true if an operation do not exists', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {some: 'value'}
          }
        }
      };
      expect(saw.isOperation('delete /path', openapi),
        'delete /path do no exists').to.be.equal(false);
    });

    it('should return true if not operation do not exists', function() {
      const openapi = {
        tags: [
          {name: 'tag'}
        ],
        paths: {
          '/path': {
            get: {some: 'value'}
          }
        }
      };
      expect(saw.isOperation('tag', openapi),
        'tag is not an operation').to.be.equal(false);
      expect(saw.isOperation('/path', openapi),
        '/path is not an operation').to.be.equal(false);
    });
  });

  describe('isTag', function() {
    it('should return true if a tag', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {
              tags: ['tag']
            }
          }
        }
      };
      expect(saw.isTag('tag', openapi)).to.be.equal(true);
    });

    it('should return false if a tag but not the good one', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {
              tags: ['other-tag']
            }
          }
        }
      };
      expect(saw.isTag('tag', openapi)).to.be.equal(false);
    });

    it('should not care if parameters or custom in path', function() {
      const openapi = {
        paths: {
          '/path': {
            'x-custom': {
              tags: ['tag']
            },
            parameters: {
              tags: ['tag']
            }
          }
        }
      };
      expect(saw.isTag('tag', openapi)).to.be.equal(false);
    });

    it('should not care if an operation do not have tags', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {}
          }
        }
      };
      expect(saw.isTag('tag', openapi)).to.be.equal(false);
    });
  });

  describe('getOperationsForPath', function() {
    it('should return all operations', function() {
      const openapi = {
        paths: {
          '/path': {
            get: 'value',
            delete: 'value'
          }
        }
      };
      const operations = saw.getOperationsForPath('/path', openapi);
      expect(operations.length, 'missiing operation(s)').to.be.equal(2);
      expect(operations[0], 'missing get /path').to.be.equal('get /path');
      expect(operations[1], 'missing delete /path').to.be.equal('delete /path');
    });

    it('should not care if path has parameters or x-custom', function() {
      const openapi = {
        paths: {
          '/path': {
            parameters: 'value',
            'x-custom': 'value'
          }
        }
      };
      const operations = saw.getOperationsForPath('/path', openapi);
      expect(operations.length,
        'should not return parameters or x-custom').to.be.equal(0);
    });

    it('should throw an error if path do not exists', function() {
      const openapi = {
        paths: {
          '/path': {
            get: 'value',
            delete: 'value'
          }
        }
      };
      try {
        saw.getOperationsForPath('/nopath', openapi);
      }
      catch (error) {
        expect(error).to.be.not.equal(null);
        expect(error.message).to.be.equal('Unknown path /nopath');
      }
    });
  });

  describe('getOperationsForTag', function() {
    const openapi = {
      paths: {
        '/path': {
          get: {
            tags: ['tag']
          },
          delete: {
            tags: ['notag']
          },
          put: {
            tags: ['tag']
          }
        },
        '/other-path': {
          put: {
            tags: ['tag']
          },
          head: {
            tags: ['notag', 'tag']
          }
        }
      }
    };
    let operations;

    it('should run without error', function() {
      try {
        operations = saw.getOperationsForTag('tag', openapi);
      }
      catch (error) {
        expect(error, 'unexpected error').to.be.equal(null);
      }
    });

    it('should return all operations with a single tag', function() {
      expect(operations.indexOf('get /path') > -1,
        'missing get /path').to.be.equal(true);
      expect(operations.indexOf('put /path') > -1,
        'missing put /path').to.be.equal(true);
      expect(operations.indexOf('put /other-path') > -1,
        'missing put /other-path').to.be.equal(true);
    });

    it('should return operations with muti tag', function() {
      expect(operations.indexOf('head /other-path',
        'missing head /other-path') > -1).to.be.equal(true);
    });

    it('should return an error if no operation for tag', function() {
      let err;
      try {
        saw.getOperationsForTag('invisibletag', openapi);
      }
      catch (error) {
        err = error;
      }
      expect(err, 'error be must be thrown').to.be.not.equal(undefined);
      expect(err.message, 'invalid error message')
        .to.be.equal('No operation for tag invisibletag');
    });
  });

  describe('getOperations', function() {
    const openapi = {
      paths: {
        '/path': {
          get: {
            tags: ['tag']
          },
          parameters: {some: 'parameters'}
        }
      }
    };

    it('should return operation', function() {
      const operations = saw.getOperations(['get /path'], openapi);
      expect(operations).to.be.eql(['get /path']);
    });

    it('should return operations for tag', function() {
      const operations = saw.getOperations(['tag'], openapi);
      expect(operations).to.be.eql(
        saw.getOperationsForTag('tag', openapi));
    });

    it('should return operations for a path', function() {
      const operations = saw.getOperations(['/path'], openapi);
      expect(operations).to.be.eql(
        saw.getOperationsForPath('/path', openapi));
    });

    it('should return an error if a limb do not match a tag, path or operation',
    function() {
      let err;
      try {
        saw.getOperations(['parameters'], openapi);
      }
      catch (error) {
        err = error;
      }
      expect(err).to.be.not.equal(undefined);
      expect(err.message)
        .to.be.equal('No tag, operation or tag matches limb parameters');
    });

    it('should return an error if a operation limb correspond to no operation',
    function() {
      let err;
      try {
        saw.getOperations(['get /parameters'], openapi);
      }
      catch (error) {
        err = error;
      }
      expect(err).to.be.not.equal(undefined);
      expect(err.message)
        .to.be.equal('No tag, operation or tag matches limb get /parameters');
    });

    it('should return an error if a path limb correspond to no path',
    function() {
      let err;
      try {
        saw.getOperations(['/parameters'], openapi);
      }
      catch (error) {
        err = error;
      }
      expect(err).to.be.not.equal(undefined);
      expect(err.message)
        .to.be.equal('No tag, operation or tag matches limb /parameters');
    });
  });

  describe('getAllDataExceptPathsAnDefinitions', function() {
    it('should return all data expect paths, ' +
       'definitions, responses and parameters', function() {
      const openapi = {
        swagger: '2.0',
        info: 'info',
        host: 'host',
        basePath: 'basePath',
        schemes: 'schemes',
        consumes: 'consumes',
        produces: 'produces',
        securityDefinitions: 'securityDefinitions',
        security: 'security',
        tags: 'tags',
        externalDocs: 'externalDocs',
        'x-custom': 'x-custom',
        paths: 'paths',
        definitions: 'definitions',
        parameters: 'parameters',
        responses: 'responses'
      };

      const subset = saw.getAllDataExceptPathsAnDefinitions(openapi);

      expect(subset.swagger, 'missing swagger').to.be.equal(openapi.swagger);
      expect(subset.info, 'missing info').to.be.equal(openapi.info);
      expect(subset.host, 'missing host').to.be.equal(openapi.host);
      expect(subset.basePath, 'missing basePath').to.be.equal(openapi.basePath);
      expect(subset.schemes, 'missing schemes').to.be.equal(openapi.schemes);
      expect(subset.consumes, 'missing consumes').to.be.equal(openapi.consumes);
      expect(subset.produces, 'missing produces').to.be.equal(openapi.produces);
      expect(subset.securityDefinitions, 'missing securityDefinitions')
        .to.be.equal(openapi.securityDefinitions);
      expect(subset.security, 'missing security').to.be.equal(openapi.security);
      expect(subset.tags, 'missing tags').to.be.equal(openapi.tags);
      expect(subset.externalDocs, 'missing externalDocs')
        .to.be.equal(openapi.externalDocs);
      expect(subset['x-custom'], 'missing x-custom')
        .to.be.equal(openapi['x-custom']);

      expect(subset.hasOwnProperty('paths'),
        'unexpected paths').to.be.equal(false);
      expect(subset.hasOwnProperty('definitions'),
        'unexpected definitions').to.be.equal(false);
      expect(subset.hasOwnProperty('parameters'),
        'unexpected parameters').to.be.equal(false);
      expect(subset.hasOwnProperty('responses'),
        'unexpected responses').to.be.equal(false);
    });
  });

  describe('getOpenApi', function() {
    it('should return a subset of an openapi', function() {
      const openapi = {
        swagger: '2.0',
        info: 'info',
        paths: {
          '/path': {
            get: {
              tags: ['tag'],
              data: {
                $ref: '#/definitions/example'
              }
            },
            post: {some: 'value'}
          },
          '/another-path': {
            get: {some: 'value'}
          }
        },
        definitions: 'definitions'
      };

      const result =
        saw.getOpenApi(['get /path'], 'filename.yaml', openapi);
      expect(result.swagger).to.be.equal(openapi.swagger);
      expect(result.info).to.be.equal(openapi.info);
      expect(result.definitions).to.be.equal(undefined);
      expect(result.paths).to.be.eql({
        '/path': {
          get: {
            tags: ['tag'],
            data: {
              $ref: 'filename.yaml#/definitions/example'
            }
          }
        }
      });
    });
  });
});
