'use strict';

const chai = require('chai');
const expect = chai.expect;
const chainsawtags = require('../lib/chainsaw-tags');
const limbs = require('../lib/limbs');
const chainsaw = require('../lib/chainsaw');

describe('chainsaw', function() {
  describe('getMultitagsOperations', function() {
    it('should return multitags operations when error is false or undefined',
    function() {
      const openapi = {
        paths: {
          '/path': {
            get: {
              tags: [
                'atag', 'anothertag'
              ]
            }
          }
        }
      };
      expect(chainsawtags._getMultitagsOperations(openapi),
        'invalid response when error is undefined')
        .to.be.eql(limbs.getMultitagsOperations(openapi));
      expect(chainsawtags._getMultitagsOperations(openapi, false),
        'invalide response when error is false')
        .to.be.eql(limbs.getMultitagsOperations(openapi));
    });
    it('should throw an error if error is true and if multi tags operations',
    function() {
      const openapi = {
        paths: {
          '/path': {
            get: {
              tags: [
                'atag', 'anothertag'
              ]
            }
          }
        }
      };
      let err;
      try {
        chainsawtags._getMultitagsOperations(openapi, true);
      }
      catch (error) {
        err = error;
      }
      expect(err, 'An error should have been thrown')
        .to.be.not.equal(undefined);
      expect(err.operations).to.be.eql(limbs.getMultitagsOperations(openapi));
    });

    it('should not throw an error if error is true and if not multi tags',
    function() {
      const openapi = {
        paths: {
          '/path': {
            get: {
              tags: [
                'atag'
              ]
            }
          }
        }
      };
      let err;
      try {
        chainsawtags._getMultitagsOperations(openapi, true);
      }
      catch (error) {
        err = error;
      }
      expect(err, 'An unexpected error occured')
        .to.be.equal(undefined);
    });
  });

  describe('getNotagOperations', function() {
    it('should return no tag operations if error is false or undefined',
    function() {
      const openapi = {
        paths: {
          '/path': {
            get: {}
          }
        }
      };
      expect(chainsawtags._getNotagOperations(openapi),
        'invalid response when error is undefined')
        .to.be.eql(limbs.getNotagOperations(openapi));
      expect(chainsawtags._getNotagOperations(openapi, false),
        'invalide response when error is false')
        .to.be.eql(limbs.getNotagOperations(openapi));
    });

    it('should throw an error if error is true and if no tags operations',
    function() {
      const openapi = {
        paths: {
          '/path': {
            get: {}
          }
        }
      };
      let err;
      try {
        chainsawtags._getNotagOperations(openapi, true);
      }
      catch (error) {
        err = error;
      }
      expect(err, 'An error should have been thrown')
        .to.be.not.equal(undefined);
      expect(err.operations).to.be.eql(limbs.getNotagOperations(openapi));
    });

    it('should not throw an error if error is true ' +
       'and if no no tags operations',
    function() {
      const openapi = {
        paths: {
          '/path': {
            get: {}
          }
        }
      };
      let err;
      try {
        chainsawtags._getNotagOperations(openapi, true);
      }
      catch (error) {
        err = error;
      }
      expect(err, 'An unexpected error occured')
        .to.be.not.equal(undefined);
    });
  });

  describe('getLimbs', function() {
    it('should return all tags', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {
              tags: [
                'atag'
              ]
            }
          }
        }
      };
      expect(chainsawtags._getLimbs(openapi)).to.be.eql({atag: ['atag']});
    });
    it('should return no tag operations', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {}
          }
        }
      };
      expect(chainsawtags._getLimbs(openapi))
        .to.be.eql({default: ['get /path']});
    });
  });

  describe('chainsawTags', function() {
    describe('only operation with tags', function() {
      const openapi = {
        swagger: '2.0',
        info: {
          version: '1.0.0',
          title: 'test'
        },
        paths: {
          '/path': {
            get: {
              tags: [
                'atag'
              ]
            }
          },
          '/another-path': {
            get: {
              tags: [
                'anothertag'
              ]
            }
          }
        }
      };

      let result;
      let err;
      before(function(done) {
        chainsawtags.chainsawTags(openapi)
        .then(function(woodchips) {
          result = woodchips;
          done();
        })
        .catch(function(error) {
          err = error;
          done();
        });
      });

      let atagOpenapi;
      before(function(done) {
        chainsaw.chainsaw(openapi, ['atag'])
        .then(function(result) {
          atagOpenapi = result;
          done();
        });
      });

      let anothertagOpenapi;
      before(function(done) {
        chainsaw.chainsaw(openapi, ['anothertag'])
        .then(function(result) {
          anothertagOpenapi = result;
          done();
        });
      });

      it('should split without error', function() {
        expect(err, 'unexpected error').to.be.equal(undefined);
        expect(result, 'unexpected result').to.be.not.equal(undefined);
      });

      it('should return spec splitted on tags', function() {
        expect(result[0].name).to.be.equal('atag');
        expect(result[0].openapi)
          .to.be.eql(atagOpenapi);
        expect(result[1].name).to.be.equal('anothertag');
        expect(result[1].openapi)
          .to.be.eql(anothertagOpenapi);
      });
    });
  });
});
