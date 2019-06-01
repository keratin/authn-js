const { series } = require('gulp');
var exec = require('child_process').exec;
var gulp = require('gulp');
var qunit = require('gulp-qunit');

function build(cb) {
  exec('yarn build', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function test(cb) {
  return gulp.src('./test/runner.html')
    .pipe(qunit());
}

exports.build = build;
exports.test = series(build, test)
exports.default = build;
