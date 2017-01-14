var browserify = require("browserify");
var buffer = require('vinyl-buffer');
var gulp = require('gulp');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var tsify = require("tsify");
var uglify = require('gulp-uglify');
var qunit = require('gulp-qunit');

function build(extension) {
  let src = extension ? `src/main.${extension}.ts` : `src/main.ts`;
  let dest = extension ? `keratin-authn.${extension}.js` : `keratin-authn.js`;

  return browserify({
    basedir: '.',
    entries: [src],
    standalone: 'KeratinAuthN'
  })
  .plugin(tsify)
  .bundle()
  .pipe(source(dest))
  .pipe(gulp.dest("dist"))
  .pipe(buffer())
  .pipe(uglify({ mangle: true }))
  .pipe(rename({ suffix: '.min' }))
  .pipe(gulp.dest('dist'));
}

gulp.task('build-core', function() {
  return build();
});

gulp.task('build-cookie', function() {
  return build('cookie');
});

gulp.task('default', ['build-core', 'build-cookie']);

gulp.task('test', ['build-core', 'build-cookie'], function () {
  return gulp.src('./test/runner.html')
    .pipe(qunit());
});
