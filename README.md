# Keratin AuthN

Keratin AuthN is an authentication service that keeps you in control of the experience without forcing you to be an expert in web security.

This library provides utilities to help integrate with AuthN from the browser. If you are running a Ruby backend, you may also be interested in [keratin/authn-rb](https://github.com/keratin/authn-rb) for backend integration.

[![npm](https://img.shields.io/npm/v/keratin-authn.svg)](https://www.npmjs.com/package/keratin-authn)

## Installation

KeratinAuthN requires global support for ES6 Promises. You can get a polyfill from https://github.com/stefanpenner/es6-promise.

Once that is arranged, choose from:

* `npm install es6-promise`
* `yarn add keratin-authn`
* `bower install es6-promise`
* or simply download and vendor [keratin-authn.js](https://raw.githubusercontent.com/keratin/authn-js/master/dist/keratin-authn.js)

## Usage

Configure the AuthN service location with something like:

```html
<script type="text/javascript">
  KeratinAuthN.ISSUER = "https://authn.myapp.com"
</script>
```

Then use the following functions to integrate the AuthN service (notation given in [TypeScript](http://www.typescriptlang.org/docs/handbook/functions.html)):

* `KeratinAuthN.signup(username: string, password: string): Promise<string>`: returns a Promise that is fulfilled with an ID Token you may use as a session for your application's backend. May error with field-specific validation failures.
* `KeratinAuthN.login(username: string, password: string): Promise<string>`: returns a Promise that is fulfilled with an ID Token you may use as a session for your application's backend. May error with generic validation failures.
* `KeratinAuthN.isAvailable(username: string): Promise<boolean>`: returns a Promise that is fulfilled with an indication whether the username is available or has been claimed.
* `KeratinAuthN.maintainSession(cookieName: string): void`: if you store the ID Token in a cookie that may be read by JavaScript (e.g. not HTTPOnly), this will take care of updating the cookie before the token expires to maintain an uninterrupted session.
* `KeratinAuthN.refresh(): Promise<string>`: if you store the ID Token in localStorage or something, you may implement a custom strategy with this API call.

## Development

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/keratin/authn-js. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.
