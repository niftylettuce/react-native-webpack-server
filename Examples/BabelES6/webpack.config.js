var fs = require('fs');
var path = require('path');
var webpack = require('webpack');

var config = {

  target: 'webworker',

  debug: true,

  devtool: 'source-map',

  entry: {
    'index.ios': ['./src/main.js'],
  },

  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
  },

  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
      query: {
        stage: 0,
        plugins: []
      }
    }]
  },

  plugins: [],

};

// Hot loader
if (process.env.HOT) {
  config.devtool = 'source-map';
  config.entry['index.ios'].unshift(
    'react-native-webpack-server/hot/entry',
    'webpack-hot-middleware/client?path=http://localhost:8082/__webpack_hmr&overlay=false'
  );
  config.output.publicPath = 'http://localhost:8082/';
  config.plugins.unshift(
    new webpack.optimize.OccurenceOrderPlugin(), 
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  );
  config.output.publicPath = 'http://localhost:8082/';
  config.module.loaders[0].query.plugins.push('react-transform');
  config.module.loaders[0].query.extra = {
    'react-transform': {
      transforms: [{
        transform: 'react-transform-hmr',
        imports: ['react-native'],
        locals: ['module']
      }]
    }
  };
}

// Production config
if (process.env.NODE_ENV === 'production') {
  config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
  config.plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = config;
