const { series } = require('gulp');
var exec = require('child_process').exec;
var qunit = require('node-qunit-phantomjs');

function build(cb) {
  exec('yarn build', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
}

function test(cb) {
  qunit('./test/runner.html');
  cb();
}

exports.build = build;
exports.test = series(build, test)
exports.default = build;
