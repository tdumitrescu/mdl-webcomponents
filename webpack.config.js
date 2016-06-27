var autoprefixer = require('autoprefixer');
var path = require('path');

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var webpackConfig = {
  entry: './src/index.js',
  output: {
    filename: 'mdl-webcomponents.js',
    path: path.join(__dirname, 'build-dev')
  },
  module: {
    loaders: [
      {
        test: /\.jade$/,
        exclude: /node_modules/,
        loaders: ['babel?presets[]=es2015', 'virtual-jade'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
        },
      },
      {
        test: /\.scss$/,
        loaders: ['css?minimize', 'postcss', 'sass'],
      },
    ],
    postcss: function() {
      return [autoprefixer(AUTOPREFIXER_BROWSERS)];
    }
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
};

module.exports = webpackConfig;
