'use strict';

const program = require('commander');
const pkg = require('../package.json');
const leatherface = require('../lib/leatherface');
const utils = require('../lib/utils');

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

  program.parse(argv);
}

exports.cli = cli;
