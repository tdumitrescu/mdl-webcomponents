var babelify = require('babelify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');

gulp.task('default', function() {
  return browserify({
      entries: './src/mdl-webcomponents.js',
      debug: true
    })
    .transform(babelify)
    .bundle()
    .pipe(source('mdl-webcomponents.js'))
    .pipe(gulp.dest('./dist'))
  ;
});
