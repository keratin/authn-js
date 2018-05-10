# Keratin AuthN

Keratin AuthN is an authentication service that keeps you in control of the experience without forcing you to be an expert in web security.

This library provides utilities to help integrate with AuthN from the browser. If you are running a Ruby backend, you may also be interested in [keratin/authn-rb](https://github.com/keratin/authn-rb) for backend integration.

[![npm](https://img.shields.io/npm/v/keratin-authn.svg)](https://www.npmjs.com/package/keratin-authn) [![Build Status](https://travis-ci.org/keratin/authn-js.svg?branch=master)](https://travis-ci.org/keratin/authn-js)

## Persistence Options

KeratinAuthN offers two persistence modes, each useful to a different type of application:

1. **LocalStorage:** Configuring `setLocalStorageStore(name: string)` adds localStorage-backed persistence. This is useful for client-side applications that do not rely on server-side rendering to generate a personalized page. The client is responsible for reading from `KeratinAuthN.session()` and adding the session token to any backend API requests, probably as a header.

2. **Cookie:** Configuring `setCookieStore(name: string)` adds support for cookie-backed persistence. This is useful for applications that rely on server-side rendering, but also requires the application to implement CSRF protection mechanisms.

## Installation

KeratinAuthN currently depends on [CORS support](http://caniuse.com/#search=cors). Future versions may add backwards compatibility, depending on demand.

KeratinAuthN also requires global support for ES6 Promises. You can get a polyfill from [stefanpenner/es6-promise](https://github.com/stefanpenner/es6-promise).

### Vanilla JS

You can load KeratinAuthN directly from the CDN:

```html
<script src="https://unpkg.com/keratin-authn/dist/keratin-authn.min.js"></script>
```

Alternately, you can download and bundle it according to your vendoring process.

### NPM or Yarn

Fetch the node module from NPM:

* `yarn add keratin-authn`
* (or `npm install keratin-authn --save`)

## Configuration

```javascript
// Configure where to connect with your AuthN service.
KeratinAuthN.setHost(url: string): void
```

```javascript
// Configure AuthN to read and write from a named cookie for session persistence.
// Will not check for an existing cookie. See `restoreSession`.
KeratinAuthN.setCookieStore(name: string): void
```

```javascript
// Configure AuthN to read and write from localStorage for session persistence. In private browsing
// mode with old versions of Safari and Android Browser (not Chrome), this will fall back to a
// simple memory storage that is lost on page refresh.
// Will not check for an existing cookie. See `restoreSession`.
KeratinAuthN.setLocalStorageStore(name: string): void
```

## API

Use the following API methods to integrate your AuthN service:

```javascript
// Check the configured storage for an existing session. If a session is found but might be stale,
// then refresh it. The promise is fulfilled if a session is restored.
KeratinAuthN.restoreSession(): Promise<void>
```

```javascript
// Attempt to import a session from AuthN. This is a more aggressive strategy than restoreSession,
// because it does not check for an existing session before invoking the refresh API.
KeratinAuthN.importSession(): Promise<void>
```

```javascript
// Get the session (as a JWT) found in AuthN's current session store. There is no guarantee this
// session will be valid or fresh, especially on page load while restoreSession is working.
KeratinAuthN.session(): string | undefined
```

```javascript
// Returns a Promise that is fulfilled when a successful signup has established a session.
// May error with field-specific validation failures.
KeratinAuthN.signup(obj: {username: string, password: string}): Promise<void>
```

```javascript
// Returns a Promise that is fulfilled when a successful login has established a session.
// May error with generic validation failures.
KeratinAuthN.login(obj: {username: string, password: string}): Promise<void>
```

```javascript
// Returns a Promise that is fulfilled when the AuthN session has been terminated.
// Automatically ends the session in AuthN's current session store.
KeratinAuthN.logout(): Promise<void>
```

```javascript
// Returns a Promise that is fulfilled with a boolean indicating whether the username is available.
// The promise rejects when availability can not be determined, as with network errors.
KeratinAuthN.isAvailable(username: string): Promise<boolean>
```

```javascript
// Requests a password reset for the given username and _always claims to succeed_.
// If this truly succeeds, AuthN will send a reset token to your server for email delivery.
KeratinAuthN.requestPasswordReset(username: string): Promise<>
```

```javascript
// Changes the password of the currently logged-in user.
// Establishes a session.
// May error with password validations, or an invalid currentPassword.
KeratinAuthN.changePassword(obj: {password: string, currentPassword: string}): Promise<void>
```

```javascript
// Resets the password of a user who is unable to log in.
// Must be given a token generated through `requestPasswordReset`.
// Establishes a session.
// May error with password validations, or invalid/expired tokens.
KeratinAuthN.resetPassword(obj: {password: string, token: string}): Promise<void>
```

## Development

Embrace the TypeScript!

Run tests with `gulp test`.

You can also load and run tests in a browser, but you'll need to serve them on a domain (not `file:///`) so that cookies function properly. The quickest method is `python -m SimpleHTTPServer`, then opening `localhost:8000/test/runner.html` in your browser.

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/keratin/authn-js. This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](http://contributor-covenant.org) code of conduct.
