# Keratin AuthN

Keratin AuthN is an authentication service that keeps you in control of the experience without forcing you to be an expert in web security.

This library provides utilities to help integrate with AuthN from the browser. If you are running a Ruby backend, you may also be interested in [keratin/authn-rb](https://github.com/keratin/authn-rb) for backend integration.

[![npm](https://img.shields.io/npm/v/keratin-authn.svg)](https://www.npmjs.com/package/keratin-authn) [![Build Status](https://travis-ci.org/keratin/authn-js.svg?branch=master)](https://travis-ci.org/keratin/authn-js)

## Installation && Usage

KeratinAuthN currently depends on [CORS support](http://caniuse.com/#search=cors). Future versions may add backwards compatibility, depending on demand.

KeratinAuthN also requires global support for ES6 Promises. You can get a polyfill from https://github.com/stefanpenner/es6-promise.

### NPM or Yarn

Fetch the node module from NPM:

* `npm install keratin-authn`
* `yarn add keratin-authn`

Then choose between the minimal API client:

```javascript
// the minimal API client
var AuthN = require("keratin-authn");

AuthN.setHost("https://authn.myapp.com");
```

or the opinionated API client with cookie-based session storage:

```javascript
var AuthN = require("keratin-authn/dist/keratin-authn.cookie");

// configuration
AuthN.setHost("https://authn.myapp.com");
AuthN.setSessionName('authn');
```

### Other

Fetch one of the standalone distributions built with UMD: [keratin-authn.min.js](https://unpkg.com/keratin-authn/dist/keratin-authn.min.js) or [keratin-authn.cookie.min.js](https://unpkg.com/keratin-authn/dist/keratin-authn.cookie.min.js)

Load or concatenate `dist/keratin-authn.min.js` or `dist/keratin-authn.cookie.min.js` according to your vendoring process, then configure:

```html
<script type="text/javascript">
  KeratinAuthN.setHost("https://authn.myapp.com");

  // if you sourced keratin-authn.cookie:
  KeratinAuthN.setSessionName('authn');
</script>
```

## API

The following API methods are always available to integrate your AuthN service (notation given in [TypeScript](http://www.typescriptlang.org/docs/handbook/functions.html)):

* `KeratinAuthN.signup(obj: {username: string, password: string}): Promise<string>`: returns a Promise that is fulfilled with an ID Token you may use as a session for your application's backend. May error with field-specific validation failures.
* `KeratinAuthN.login(obj: {username: string, password: string}): Promise<string>`: returns a Promise that is fulfilled with an ID Token you may use as a session for your application's backend. May error with generic validation failures.
* `KeratinAuthN.logout(): Promise<void>`: returns a Promise that is fulfilled when the AuthN session has been terminated through an invisible iFrame. You are still responsible for discarding the app session.
* `KeratinAuthN.isAvailable(username: string): Promise<boolean>`: returns a Promise that is fulfilled with an indication whether the username is available or has been claimed.
* `KeratinAuthN.refresh(): Promise<string>`: returns a Promise that is fulfilled with a fresh ID Token unless the user has been logged-out from AuthN
* `KeratinAuthN.requestPasswordReset(username: string): Promise<>`: requests a password reset for the given username and _always claims to succeed_. If this truly succeeds, AuthN will send a reset token to your server for email delivery.
* `KeratinAuthN.changePassword(obj: {password: string, token?: string}): Promise<string>`: returns a Promise that is fulfilled when the password has been reset. If the user is currently logged in, no token is necessary. If the user is logged out, a token generated as a result of `requestPasswordReset` must be provided. May error with password validations, or invalid/expired tokens.

If you have loaded `keratin-authn.cookie`, then:

* `KeratinAuthN.setSessionName(name: string): void` will configure the cookie name and automatically begin monitoring and refreshing the cookie before it expires. You should call this on each page load.
* `KeratinAuthN.signup()`, `KeratinAuthN.login()`, and `KeratinAuthN.changePassword()` will automatically set the ID Token as a cookie.
* `KeratinAuthN.logout()` will automatically delete the ID Token cookie.

## Development

Embrace the TypeScript!

Run tests with `gulp test`.

You can also load and run tests in a browser, but you'll need to serve them on a domain (not `file:///`) so that cookies function properly. The quickest method is `python -m SimpleHTTPServer`, then opening `localhost:8000/test/runner.html` in your browser.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/keratin/authn-js. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.
