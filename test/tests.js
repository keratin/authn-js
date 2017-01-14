QUnit.begin(function () {
  KeratinAuthN.setHost('https://authn.example.com');
  KeratinAuthN.setSessionName('authn');
});

QUnit.module("api", {
  beforeEach: function () {
    this.server = sinon.fakeServer.create({respondImmediately: true});
  },
  afterEach: function () {
    this.server.restore();
  }
});

function jwt(payload) {
  var metadata = {};
  var signature = 'BEEF';
  return btoa(JSON.stringify(metadata)) + '.' +
         btoa(JSON.stringify(payload)) + '.' +
         btoa(signature);
}

function id_token(options) {
  var age = options.age || 600;
  var iat = Math.floor(Date.now() / 1000) - age;
  return jwt({
    sub: 1,
    iat: iat,
    exp: iat + 3600
  });
}

function json_result(data) {
  return JSON.stringify({result: data});
}

function json_error(data) {
  var errors = Object.keys(data)
    .map(function(k){ return {field: k, message: data[k]} });

  return JSON.stringify({errors: errors})
}

QUnit.test("signup success", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/accounts',
    json_result({id_token: id_token({age: 1})})
  );

  return KeratinAuthN.signup({username: 'test', password: 'test'})
    .then(function (token) {
      assert.ok(token.length > 0, "token is a string of some length");
      assert.equal(token.split('.').length, 3, "token has three parts");
    });
});

QUnit.test("signup failure", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/accounts',
    json_error({foo: 'bar'})
  );

  return KeratinAuthN.signup({username: 'test', password: 'test'})
    .then(function (data) { assert.ok(false, "should not succeed") })
    .catch(function (errors) {
      assert.equal(errors.length, 1, "one error");
      assert.equal(errors[0].field, 'foo', 'error has field');
      assert.equal(errors[0].message, 'bar', 'error has message');
    });
});

QUnit.test("signup duplicate", function(assert) {
  var done = assert.async(2);

  this.server.respondImmediately = false;
  this.server.respondWith('POST', 'https://authn.example.com/accounts',
    json_result({id_token: id_token({age: 1})})
  );

  KeratinAuthN.signup({username: 'test', password: 'test'})
    .then(function (data) { assert.ok(true, "first request finished") })
    .then(done);

  KeratinAuthN.signup({username: 'test', password: 'test'})
    .then(function (data) { assert.ok(false, "should not proceed") })
    .catch(function(errors) {
      assert.equal(errors, "duplicate", "caught duplicate request");
      done();
    })

  this.server.respond();
});

// isAvailable()
// refresh()
// login()
// logout()
// setSessionName() [with fresh session, with aging session]
