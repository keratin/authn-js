var gulp = require('gulp');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('default', function() {
  return tsProject.src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('dist'))
    .pipe(uglify({ mangle: true }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'));
});
