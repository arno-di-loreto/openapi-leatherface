'use strict';

const chai = require('chai');
const expect = chai.expect;
const utils = require('../lib/utils');
const mock = require('mock-fs');
const fs = require('fs');

describe('utils', function() {
  describe('saveJsonFile', function() {
    before(function() {
      mock({
        '/path': {}
      });
    });

    after(function() {
      mock.restore();
    });

    it('should save a json file', function() {
      try {
        const data = {some: 'data'};
        const filename = '/path/file.json';
        utils.saveJsonFile(filename, data);
        const file = JSON.parse(fs.readFileSync(filename, 'utf8'));
        expect(file).to.be.eql(data);
      }
      catch (error) {
        console.log(error);
        expect(error, 'unexpected error').to.be.equal(null);
      }
    });
  });

  describe('saveYamlFile', function() {
    before(function() {
      mock({
        '/path': {}
      });
    });

    after(function() {
      mock.restore();
    });

    it('should save a yaml file', function() {
      try {
        const data = {some: 'data', other: 'data'};
        const filename = '/path/file.json';
        utils.saveYamlFile(filename, data);
        const yaml = fs.readFileSync(filename, 'utf8');
        expect(yaml).to.be.equal('some: data\nother: data\n');
      }
      catch (error) {
        console.log(error);
        expect(error, 'unexpected error').to.be.equal(null);
      }
    });
  });

  describe('saveFile', function() {
    before(function() {
      mock({
        '/path': {}
      });
    });

    after(function() {
      mock.restore();
    });

    it('should throw an expection on unknown format', function() {
      try {
        utils.saveFile('file', '.unknown', {});
        expect(true, 'an exception should have been thrown').to.be.equal(false);
      }
      catch (error) {
        expect(error).to.be.not.equal(null);
      }
    });

    it('should save a json file when format is json', function() {
      try {
        const data = {some: 'data'};
        const filename = '/path/file';
        const format = 'json';
        utils.saveFile(filename, format, data);
        const file = JSON.parse(fs.readFileSync(filename, 'utf8'));
        expect(file).to.be.eql(data);
      }
      catch (error) {
        console.log(error);
        expect(error, 'unexpected error').to.be.equal(null);
      }
    });

    it('should save a yaml file when format is yaml', function() {
      try {
        const data = {some: 'data', other: 'data'};
        const filename = '/path/file';
        const format = 'yaml';
        utils.saveFile(filename, format, data);
        const yaml = fs.readFileSync(filename, 'utf8');
        expect(yaml).to.be.equal('some: data\nother: data\n');
      }
      catch (error) {
        console.log(error);
        expect(error, 'unexpected error').to.be.equal(null);
      }
    });
  });

  describe('isHttpMethod', function() {
    it('should return true id value is a HTTP methode', function() {
      const methods =
        ['get', 'put', 'post', 'delete', 'patch', 'put', 'head', 'options'];
      for (let i = 0; i < methods.length; i++) {
        expect(utils.isHttpMethod(methods[i]), methods[i]).to.be.equal(true);
      }
    });

    it('should return false if value is not a HTTP methode', function() {
      expect(utils.isHttpMethod('nothttpmethod'), 'not a http method')
        .to.be.equal(false);
    });
  });
});
