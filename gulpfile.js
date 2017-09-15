var exec = require('child_process').exec;
var gulp = require('gulp');
var qunit = require('gulp-qunit');

gulp.task('build', function(cb) {
  exec('yarn build', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('default', ['build']);

gulp.task('test', ['build'], function () {
  return gulp.src('./test/runner.html')
    .pipe(qunit());
});
