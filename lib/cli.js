'use strict';

const program = require('commander');
const pkg = require('../package.json');
const leatherface = require('../lib/leatherface');
const utils = require('../lib/utils');
const path = require('path');

/**
 * @description CLI function
 * @param {String[]} argv - Command line arguments
 * @param {Function} exit Exit callback
 * @param {Boolean} [silent=false] Console.log disabled
 */
function cli(argv, exit) {
  program
    .version(pkg.version)
    .description('OpenAPI Leatherface ' + pkg.version);

  program
    .command('chainsaw <spec> [limbs...]')
    .option('-o, --output <output>', 'Output filename')
    .option('-f, --format <format>', 'Format', /^(yaml|json)$/i)
    .action(function(spec, limbs, options) {
      console.log('spec', spec);
      console.log('output', options.output);
      console.log('format', options.format);
      console.log('limbs', limbs);
      // console.log('options', options);
      leatherface.chainsaw(spec, limbs)
      .then(function(result) {
        utils.saveFile(options.output, options.format, result);
        console.log(JSON.stringify(result, null, 2));
        exit(0);
      })
      .catch(function(error) {
        console.log(error);
        exit(1);
      });
    });

  program
    .command('chainsaw-tags <spec>')
    .option('-o, --output <output>', 'Output directory')
    .option('-f, --format <format>', 'Format', /^(yaml|json)$/i)
    .action(function(spec, options) {
      leatherface.chainsawTags(spec)
      .then(function(result) {
        for (let i = 0; i < result.length; i++) {
          const filename =
            path.join(options.output, result[i].name + '.' + options.format);
          utils.saveFile(filename, options.format, result[i].openapi);
          console.log('Tag %s saved in ', result[i].name, filename);
        }
        exit(0);
      })
      .catch(function(error) {
        console.log(error);
        exit(1);
      });
    });

  program.parse(argv);
}

exports.cli = cli;
