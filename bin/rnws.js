#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const program = require('commander');
const packageJson = require('../package.json');
const createBundle = require('../lib/createBundle');
const Server = require('../lib/Server');

/**
 * Create a new array with falsey values removed
 * @param  {Array} arr An array
 * @return {Array}     The array with falsey values removed
 */
const compact = arr => arr.filter(Boolean);

/**
 * Create a server instance using the provided options.
 * @param  {Object} opts react-native-webpack-server options
 * @return {Server}      react-native-webpack-server server
 */
function createServer(opts) {
  opts.webpackConfigPath = path.resolve(process.cwd(), opts.webpackConfigPath);
  if (fs.existsSync(opts.webpackConfigPath)) {
    opts.webpackConfig = require(path.resolve(process.cwd(), opts.webpackConfigPath));
  } else {
    throw new Error('Must specify webpackConfigPath or create ./webpack.config.js');
  }
  delete opts.webpackConfigPath;

  const server = new Server(opts);
  return server;
}

/**
 * Apply a set of common options to the commander.js program.
 * @param  {Object} program The commander.js program
 * @return {Object}         The program with options applied
 */
function commonOptions(program) {
  return program
    .option(
      '-H, --hostname [hostname]',
      'Hostname on which the server will listen. [localhost]',
      'localhost'
    )
    .option(
      '-P, --port [port]',
      'Port on which the server will listen. [8080]',
      8080
    )
    .option(
      '-p, --packagerPort [port]',
      'Port on which the react-native packager will listen. [8081]',
      8081
    )
    .option(
      '-w, --webpackPort [port]',
      'Port on which the webpack dev server will listen. [8082]',
      8082
    )
    .option(
      '-c, --webpackConfigPath [path]',
      'Path to the webpack configuration file. [webpack.config.js]',
      'webpack.config.js'
    )
    .option(
      '--no-android',
      'Disable support for Android. [false]',
      false
    )
    .option(
      '--no-ios',
      'Disable support for iOS. [false]',
      false
    )
    .option(
      '-A, --androidEntry [name]',
      'Android entry module name. Has no effect if \'--no-android\' is passed. [index.android]',
      'index.android'
    )
    .option(
      '-I, --iosEntry [name]',
      'iOS entry module name. Has no effect if \'--no-ios\' is passed. [index.ios]',
      'index.ios'
    )
    .option(
      '-r, --resetCache',
      'Remove cached react-native packager files [false]',
      false
    );
}

commonOptions(program.command('start'))
  .description('Start the webpack server.')
  .option('-r, --hot', 'Enable hot module replacement. [false]', false)
  .action(function(options) {
    const opts = options.opts();
    const server = createServer(opts);
    server.start();
  });

commonOptions(program.command('bundle'))
  .description('Bundle the app for distribution.')
  .option(
    '--androidBundlePath [path]',
    'Path where the Android bundle should be written. [./android/app/src/main/assets/index.android.bundle]',
    './android/app/src/main/assets/index.android.bundle'
  )
  .option(
    '--iosBundlePath [path]',
    'Path where the iOS bundle should be written. [./ios/main.jsbundle]',
    './ios/main.jsbundle'
  )
  .option(
    '--no-optimize',
    'Whether the bundle should skip optimization. [false]',
    false
  )
  .action(function(options) {
    const opts = options.opts();
    const server = createServer(opts);

    const doBundle = () => Promise.all(compact([
      opts.android && createBundle(server, {
        platform: 'android',
        targetPath: opts.androidBundlePath,
        dev: !opts.optimize,
        minify: opts.optimize,
      }),
      opts.ios && createBundle(server, {
        platform: 'ios',
        targetPath: opts.iosBundlePath,
        dev: !opts.optimize,
        minify: opts.optimize,
      }),
    ]));

    server.start()
      .then(doBundle)
      .finally(() => {
        server.stop();
      });
  });

program.version(packageJson.version);
program.parse(process.argv);
