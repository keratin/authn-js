var browserify = require("browserify");
var buffer = require('vinyl-buffer');
var exec = require('child_process').exec;
var gulp = require('gulp');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var qunit = require('gulp-qunit');

function build(extension) {
  let src = extension ? `lib/main.${extension}.js` : `lib/main.js`;
  let dest = extension ? `keratin-authn.${extension}.js` : `keratin-authn.js`;

  return browserify({
    basedir: '.',
    entries: [src],
    standalone: 'KeratinAuthN'
  })
  .bundle()
  .pipe(source(dest))
  .pipe(gulp.dest("dist"))
  .pipe(buffer())
  .pipe(uglify({ mangle: true }))
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest('dist'));
}

gulp.task('build-core', ['compile'], function() {
  return build();
});

gulp.task('build-cookie', ['compile'], function() {
  return build('cookie');
});

gulp.task('default', ['build-core', 'build-cookie']);

gulp.task('test', ['build-core', 'build-cookie'], function () {
  return gulp.src('./test/runner.html')
    .pipe(qunit());
});

gulp.task('compile', function (cb) {
  exec('tsc', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});
