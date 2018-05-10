QUnit.begin(function () {
  KeratinAuthN.setHost('https://authn.example.com');
  KeratinAuthN.setCookieStore('authn');
  writeCookie('hello', 'world');
  writeCookie('foo', 'bar');
});

QUnit.testDone(function () {
  deleteCookie('authn');
});

function jwt(payload) {
  var metadata = {};
  var signature = 'BEEF';
  return btoa(JSON.stringify(metadata)) + '.' +
         btoa(JSON.stringify(payload)) + '.' +
         btoa(signature);
}

function idToken(options) {
  var age = options.age || 600;
  var iat = Math.floor(Date.now() / 1000) - age;
  return jwt({
    sub: 1,
    iat: iat,
    exp: iat + 3600
  });
}

function jsonResult(data) {
  return JSON.stringify({result: data});
}

function jsonErrors(data) {
  var errors = Object.keys(data)
    .map(function(k){ return {field: k, message: data[k]} });

  return JSON.stringify({errors: errors})
}

function readCookie(name) {
  return document.cookie.replace(new RegExp('(?:(?:^|.*;\\\s*)' + name + '\\\s*\\\=\\\s*([^;]*).*$)|^.*$'), "$1");
}

function writeCookie(name, val) {
  document.cookie = name + '=' + val + ';';
}

function deleteCookie(name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function assertInstalledToken(assertions) {
  return function () {
    var token = KeratinAuthN.session();
    assertions.ok(token.length > 0, "token is a string of some length");
    assertions.equal(token.split('.').length, 3, "token has three parts");

    // NOTE: this test will fail when qunit is run in a browser with the
    //       `file:///` protocol
    assertions.equal(readCookie('authn'), token, "token is saved as cookie");
  }
}

function refuteSuccess(assertions) {
  return function (data) {
    assertions.notOk(true, "should not succeed");
  }
}

var startServer = {
  beforeEach: function () {
    this.server = sinon.fakeServer.create({respondImmediately: true});
  },
  afterEach: function () {
    this.server.restore();
  }
};

QUnit.module("signup", startServer);
QUnit.test("success", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/accounts',
    jsonResult({id_token: idToken({age: 1})})
  );

  return KeratinAuthN.signup({username: 'test', password: 'test'})
    .then(assertInstalledToken(assert));
});
QUnit.test("failure", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/accounts',
    jsonErrors({foo: 'bar'})
  );

  return KeratinAuthN.signup({username: 'test', password: 'test'})
    .then(refuteSuccess(assert))
    .catch(function(errors) {
      assert.deepEqual(errors, [{field: 'foo', message: 'bar'}]);
    });
});
QUnit.test("double submit", function(assert) {
  var done = assert.async(2);

  this.server.respondImmediately = false;
  this.server.respondWith('POST', 'https://authn.example.com/accounts',
    jsonResult({id_token: idToken({age: 1})})
  );

  KeratinAuthN.signup({username: 'test', password: 'test'})
    .then(function (data) { assert.ok(true, "first request finished") })
    .then(done);

  KeratinAuthN.signup({username: 'test', password: 'test'})
    .then(refuteSuccess(assert))
    .catch(function(errors) {
      assert.deepEqual(errors, [{message: 'duplicate'}]);
      done();
    });

  this.server.respond();
});

QUnit.module("isAvailable", startServer);
QUnit.test("name is not taken", function(assert) {
  this.server.respondWith('GET', 'https://authn.example.com/accounts/available?username=test',
    jsonResult(true)
  );

  return KeratinAuthN.isAvailable('test')
    .then(function (availability) {
      assert.ok(availability, "is available");
    });
});
QUnit.test("name is taken", function(assert) {
  this.server.respondWith('GET', 'https://authn.example.com/accounts/available?username=test',
    jsonErrors({username: 'TAKEN'})
  );

  return KeratinAuthN.isAvailable('test')
    .then(function (availability) {
      assert.notOk(availability, "is taken")
    });
});

QUnit.module("restoreSession", startServer);
QUnit.test("no existing session", function(assert) {
  deleteCookie('authn');

  return KeratinAuthN.restoreSession()
    .then(refuteSuccess(assert))
    .catch(function () {
      assert.notOk(KeratinAuthN.session(), "no session");
    });
});
QUnit.test("existing session", function(assert) {
  writeCookie('authn', idToken({age: 1}));

  return KeratinAuthN.restoreSession()
    .then(function () {
      assert.ok(KeratinAuthN.session(), "session found");
    });
});
QUnit.test("aging session", function(assert) {
  var oldSession = idToken({age: 3000});
  var newSession = idToken({age: 1});

  writeCookie('authn', oldSession);
  this.server.respondWith('GET', 'https://authn.example.com/session/refresh',
    jsonResult({id_token: newSession})
  );

  return KeratinAuthN.restoreSession()
    .then(function () {
      assert.equal(KeratinAuthN.session(), newSession, "session is updated");
    });
});
QUnit.test("aging and revoked session", function(assert) {
  writeCookie('authn', idToken({age: 3000}));
  this.server.respondWith('GET', 'https://authn.example.com/session/refresh', [
    401,
    {},
    ""
  ]);

  return KeratinAuthN.restoreSession()
    .then(refuteSuccess(assert))
    .catch(function () {
      assert.notOk(KeratinAuthN.session(), "session was revoked");
    });
});
QUnit.test("expired session", function(assert) {
  var oldSession = idToken({age: 9999});
  var newSession = idToken({age: 1});

  writeCookie('authn', oldSession);
  this.server.respondWith('GET', 'https://authn.example.com/session/refresh',
    jsonResult({id_token: newSession})
  );

  return KeratinAuthN.restoreSession()
    .then(function () {
      assert.equal(KeratinAuthN.session(), newSession, "session re-established");
    });
});
QUnit.test("expired and revoked session", function(assert) {
  writeCookie('authn', idToken({age: 9999}));
  this.server.respondWith('GET', 'https://authn.example.com/session/refresh', [
    401,
    {},
    ""
  ]);

  return KeratinAuthN.restoreSession()
    .then(refuteSuccess(assert))
    .catch(function () {
      assert.notOk(KeratinAuthN.session(), "session was revoked");
    });
});
QUnit.test("malformed JWT", function(assert) {
  writeCookie('authn', 'invalid');

  return KeratinAuthN.restoreSession()
    .then(refuteSuccess(assert))
    .catch(function (e) {
      assert.equal(e, 'Malformed JWT: invalid encoding');
    });
});

QUnit.module("importSession", startServer);
QUnit.test("no existing session", function(assert) {
  deleteCookie('authn');
  var newSession = idToken({age: 1});

  this.server.respondWith('GET', 'https://authn.example.com/session/refresh',
    jsonResult({id_token: newSession})
  );

  return KeratinAuthN.importSession()
    .then(function () {
      assert.equal(KeratinAuthN.session(), newSession, "session re-established");
    });
});

QUnit.module("login", startServer);
QUnit.test("success", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/session',
    jsonResult({id_token: idToken({age: 1})})
  );

  return KeratinAuthN.login({username: 'test', password: 'test'})
    .then(assertInstalledToken(assert));
});
QUnit.test("failure", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/session',
    jsonErrors({foo: 'bar'})
  );

  return KeratinAuthN.login({username: 'test', password: 'test'})
    .then(refuteSuccess(assert))
    .catch(function(errors) {
      assert.deepEqual(errors, [{field: 'foo', message: 'bar'}]);
    });
});

QUnit.module("requestPasswordReset", startServer);
QUnit.test("success or failure", function(assert) {
  this.server.respondWith('GET', 'https://authn.example.com/password/reset?username=test', '');

  return KeratinAuthN.requestPasswordReset('test')
    .then(function () {
      assert.ok(true, "should always succeed")
    })
});

QUnit.module("changePassword", startServer);
QUnit.test("success", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/password',
    jsonResult({id_token: idToken({age: 1})})
  );

  return KeratinAuthN.changePassword({
      password: 'new',
      currentPassword: 'old'
    })
    .then(assertInstalledToken(assert));
});
QUnit.test("failure", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/password',
    jsonErrors({foo: 'bar'})
  );

  return KeratinAuthN.changePassword({
      password: 'new',
      currentPassword: 'wrong'
    })
    .then(refuteSuccess(assert))
    .catch(function(errors) {
      assert.deepEqual(errors, [{field: 'foo', message: 'bar'}]);
    });
});

QUnit.module("resetPassword", startServer);
QUnit.test("success", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/password',
    jsonResult({id_token: idToken({age: 1})})
  );

  return KeratinAuthN.resetPassword({
      password: 'new',
      token: jwt({foo: 'bar'})
    })
    .then(assertInstalledToken(assert));
});
QUnit.test("failure", function(assert) {
  this.server.respondWith('POST', 'https://authn.example.com/password',
    jsonErrors({foo: 'bar'})
  );

  return KeratinAuthN.resetPassword({
      password: 'new',
      token: jwt({foo: 'bar'})
    })
    .then(refuteSuccess(assert))
    .catch(function(errors) {
      assert.deepEqual(errors, [{field: 'foo', message: 'bar'}]);
    });
});

QUnit.module("logout", startServer);
QUnit.test("success", function(assert) {
  this.server.respondWith('DELETE', 'https://authn.example.com/session', '');
  writeCookie('authn', idToken({age: 1}));
  return KeratinAuthN.restoreSession()
    .then(function () {
      assert.ok(KeratinAuthN.session());
    })
    .then(KeratinAuthN.logout)
    .then(function() {
      assert.notOk(KeratinAuthN.session());
    });
});
