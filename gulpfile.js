var browserify = require("browserify");
var buffer = require('vinyl-buffer');
var exec = require('child_process').exec;
var gulp = require('gulp');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var qunit = require('gulp-qunit');

// compile from src to lib (commonjs)
gulp.task('compile', function (cb) {
  exec('tsc', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

// build from lib to dist (UMD)
gulp.task('build', ['compile'], function() {
  return browserify({
      basedir: '.',
      entries: ['lib/index.js'],
      standalone: 'KeratinAuthN'
    })
    .bundle()
    .pipe(source('keratin-authn.js'))
    .pipe(gulp.dest("dist"))
    .pipe(buffer())
    .pipe(uglify({ mangle: true }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['build']);

gulp.task('test', ['build'], function () {
  return gulp.src('./test/runner.html')
    .pipe(qunit());
});
