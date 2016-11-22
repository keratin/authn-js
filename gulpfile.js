var browserify = require("browserify");
var buffer = require('vinyl-buffer');
var gulp = require('gulp');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var tsify = require("tsify");
var uglify = require('gulp-uglify');

gulp.task('default', function() {
  return browserify({
      basedir: '.',
      entries: ['src/keratin-authn.ts']
    })
    .plugin(tsify)
    .bundle()
    .pipe(source('keratin-authn.js'))
    .pipe(gulp.dest("dist"))
    .pipe(buffer())
    .pipe(uglify({ mangle: true }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'));
});
