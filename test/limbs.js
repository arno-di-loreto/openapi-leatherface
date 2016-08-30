'use strict';

const chai = require('chai');
const expect = chai.expect;
const limbs = require('../lib/limbs');

describe('limbs', function() {
  describe('getTagsOperations', function() {
    it('should return simple tag operation', function() {
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

      const tags = limbs.getTagsOperations(openapi);
      expect(tags.length).to.be.equal(1);
      expect(tags[0].tag).to.be.equal('atag');
      const operations = tags[0].operations;
      expect(operations.length).to.be.equal(1);
      expect(operations[0].method).to.be.equal('get');
      expect(operations[0].path).to.be.equal('/path');
      expect(operations[0].multitags).to.be.equal(false);
    });

    it('should return multi tags operation', function() {
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

      const tags = limbs.getTagsOperations(openapi);
      expect(tags.length).to.be.equal(2);

      expect(tags[0].tag).to.be.equal('atag');
      const atagOperations = tags[0].operations;
      expect(atagOperations.length).to.be.equal(1);
      expect(atagOperations[0].method).to.be.equal('get');
      expect(atagOperations[0].path).to.be.equal('/path');
      expect(atagOperations[0].multitags).to.be.equal(true);

      expect(tags[1].tag).to.be.equal('anothertag');
      const anothertagOperations = tags[1].operations;
      expect(anothertagOperations.length).to.be.equal(1);
      expect(anothertagOperations[0].method).to.be.equal('get');
      expect(anothertagOperations[0].path).to.be.equal('/path');
      expect(anothertagOperations[0].multitags).to.be.equal(true);
    });

    it('should not return operation without tag', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {}
          }
        }
      };

      const tags = limbs.getTagsOperations(openapi);
      expect(tags.length).to.be.equal(0);
    });
  });

  describe('getNotagOperations', function() {
    it('should return operation without tag', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {}
          }
        }
      };

      const operations = limbs.getNotagOperations(openapi);
      expect(operations.length).to.be.equal(1);
      expect(operations[0].method).to.be.equal('get');
      expect(operations[0].path).to.be.equal('/path');
    });

    it('should not return operation with tag', function() {
      const openapi = {
        paths: {
          '/path': {
            get: {
              tags: ['atag']
            }
          }
        }
      };

      const operations = limbs.getNotagOperations(openapi);
      expect(operations.length).to.be.equal(0);
    });
  });

  describe('getMultitagsOperations', function() {
    it('should return multitags operations', function() {
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

      const multitags = limbs.getMultitagsOperations(openapi);
      expect(multitags.length).to.be.equal(1);
      expect(multitags[0].path).to.be.equal('/path');
      expect(multitags[0].method).to.be.equal('get');
      expect(multitags[0].tags).to.be.eql(['atag', 'anothertag']);
    });

    it('should not return simple tag operations', function() {
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

      const multitags = limbs.getMultitagsOperations(openapi);
      expect(multitags.length).to.be.equal(0);
    });
  });

  describe('getTags', function() {
    it('should return tags list', function() {
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
      const tags = limbs.getTags(openapi);
      expect(tags.length).to.be.equal(1);
      expect(tags[0]).to.be.equal('atag');
    });
  });
});
