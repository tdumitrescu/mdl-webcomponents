var autoprefixer = require('gulp-autoprefixer');
var babelify = require('babelify');
var browserify = require('browserify');
var cssInlineImages = require('gulp-css-inline-images');
var csso = require('gulp-csso');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var size = require('gulp-size');
var source = require('vinyl-source-stream');
var through = require('through2');

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
var MDL_BASE = 'node_modules/material-design-lite/';


gulp.task('default', ['cssjs'], function() {
  return browserify({
      entries: './src/index.js',
      debug: true
    })
    .transform(babelify)
    .bundle()
    .pipe(source('mdl-webcomponents.js'))
    .pipe(gulp.dest('./dist'))
  ;
});

gulp.task('cssjs', function() {
  return gulp.src([MDL_BASE + 'src/**/_*.scss'])
    .pipe(rename(function(path) {
      path.basename = path.basename.replace(/^_/, '');
    }))
    .pipe(sass({precision: 10, onError: console.error.bind(console, 'Sass error:')}))
    .pipe(cssInlineImages({webRoot: MDL_BASE + 'src'}))
    .pipe(autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulpif('*.css', csso()))
    .pipe(rename(function(path) {
      path.dirname = '.';
      path.extname += '.js';
    }))
    .pipe((function() {
      return through.obj(function(file, enc, cb) {
        var contents = file.contents.toString().replace(/'/g, "\\'");
        if (contents) {
          var out = "export default '" + contents + "';\n";
          file.contents = new Buffer(out, 'utf8');
          this.push(file);
        }
        cb();
      });
    })())
    .pipe(gulp.dest('./src/cssjs'))
    .pipe(size({title: 'cssjs'}))
  ;
});
