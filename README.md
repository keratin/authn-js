# Keratin AuthN

Keratin AuthN is an authentication service that keeps you in control of the experience without forcing you to be an expert in web security.

This library provides utilities to help integrate with AuthN from the browser. If you are running a Ruby backend, you may also be interested in [keratin/authn-rb](https://github.com/keratin/authn-rb) for backend integration.

[![npm](https://img.shields.io/npm/v/keratin-authn.svg)](https://www.npmjs.com/package/keratin-authn)

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

    ```
    var AuthN = require("keratin-authn/dist/keratin-authn.cookie");

    // configuration
    AuthN.setHost("https://authn.myapp.com");
    AuthN.setSession('authn');

    // maintain any existing session
    AuthN.maintainSession();
    ```

### Other

Fetch one of the standalone distributions built with UMD: [keratin-authn.min.js](https://raw.githubusercontent.com/keratin/authn-js/master/dist/keratin-authn.min.js) or [keratin-authn.cookie.min.js](https://raw.githubusercontent.com/keratin/authn-js/master/dist/keratin-authn.cookie.min.js)

Load or concatenate `dist/keratin-authn.min.js` or `dist/keratin-authn.cookie.min.js` according to your vendoring process, then configure:

    ```html
    <script type="text/javascript">
      KeratinAuthN.setHost("https://authn.myapp.com");

      // if you sourced keratin-authn.cookie:
      KeratinAuthN.setSession('authn');
      KeratinAuthN.maintainSession();
    </script>
    ```

## API

The following API methods are always available to integrate your AuthN service (notation given in [TypeScript](http://www.typescriptlang.org/docs/handbook/functions.html)):

* `KeratinAuthN.signup(username: string, password: string): Promise<string>`: returns a Promise that is fulfilled with an ID Token you may use as a session for your application's backend. May error with field-specific validation failures.
* `KeratinAuthN.login(username: string, password: string): Promise<string>`: returns a Promise that is fulfilled with an ID Token you may use as a session for your application's backend. May error with generic validation failures.
* `KeratinAuthN.isAvailable(username: string): Promise<boolean>`: returns a Promise that is fulfilled with an indication whether the username is available or has been claimed.
* `KeratinAuthN.refresh(): Promise<string>`: returns a Promise that is fulfilled with a fresh ID Token unless the user has been logged-out from AuthN

If you have loaded `keratin-authn.cookie`, then:

* `KeratinAuthN.signup()` and `KeratinAuthN.login()` will automatically set the ID Token as a cookie.
* `KeratinAuthN.maintainSession(): void` will appropriately monitor and refresh the cookie before it expires. You should call this on each page load.

## Development

Embrace the TypeScript!

Tests are forthcoming. This library should not be considered production-ready until those exist.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/keratin/authn-js. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.
