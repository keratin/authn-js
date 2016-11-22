(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.KeratinAuthN = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var verbs_1 = require("./verbs");
var inflight = false;
var ISSUER = '';
function setHost(URL) {
    ISSUER = URL;
}
exports.setHost = setHost;
function signup(credentials) {
    return new Promise(function (fulfill, reject) {
        if (inflight) {
            reject("duplicate");
            return;
        }
        else {
            inflight = true;
        }
        verbs_1.post(url('/accounts'), formData(credentials))
            .then(function (result) { return fulfill(result.id_token); }, function (errors) { return reject(errors); }).then(function () { return inflight = false; });
    });
}
exports.signup = signup;
function isAvailable(username) {
    return verbs_1.get(url('/accounts/available'), formDataItem('username', username));
}
exports.isAvailable = isAvailable;
function refresh() {
    return verbs_1.get(url('/sessions/refresh'), '')
        .then(function (result) { return result.id_token; });
}
exports.refresh = refresh;
function login(credentials) {
    return verbs_1.post(url('/sessions'), formData(credentials))
        .then(function (result) { return result.id_token; });
}
exports.login = login;
function url(path) {
    if (!ISSUER.length) {
        throw "ISSUER not set";
    }
    return "" + ISSUER + path;
}
function formData(credentials) {
    return formDataItem('username', credentials.username) + "&" + formDataItem('password', credentials.password);
}
function formDataItem(k, v) {
    return k + "=" + encodeURIComponent(v);
}

},{"./verbs":6}],2:[function(require,module,exports){
"use strict";
var session_1 = require("./session");
var CookieSessionStore = (function () {
    function CookieSessionStore(cookieName) {
        this.sessionName = cookieName;
        this.secureFlag = (window.location.protocol === 'https:') ? '; secure' : '';
        this.session = new session_1.Session(document.cookie.replace("(?:(?:^|.*;s*)" + this.sessionName + "s*=s*([^;]*).*$)|^.*$", "$1"));
    }
    CookieSessionStore.prototype.update = function (val) {
        this.session = new session_1.Session(val);
        document.cookie = this.sessionName + "=" + val + this.secureFlag;
    };
    CookieSessionStore.prototype.delete = function () {
        document.cookie = this.sessionName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    };
    return CookieSessionStore;
}());
exports.CookieSessionStore = CookieSessionStore;

},{"./session":4}],3:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var session_manager_1 = require("./session_manager");
var cookie_store_1 = require("./cookie_store");
var api_1 = require("./api");
var unconfigured = "AuthN must be configured with setSession()";
var store;
function setSessionName(cookieName) {
    store = new cookie_store_1.CookieSessionStore(cookieName);
}
exports.setSessionName = setSessionName;
function signup(credentials) {
    return api_1.signup(credentials)
        .then(updateAndReturn);
}
exports.signup = signup;
function login(credentials) {
    return api_1.login(credentials)
        .then(updateAndReturn);
}
exports.login = login;
function maintainSession() {
    if (!store) {
        throw unconfigured;
    }
    (new session_manager_1.SessionManager(store)).maintain();
}
exports.maintainSession = maintainSession;
// export remaining API methods unmodified
__export(require("./api"));
function updateAndReturn(token) {
    if (!store) {
        throw unconfigured;
    }
    ;
    store.update(token);
    return token;
}

},{"./api":1,"./cookie_store":2,"./session_manager":5}],4:[function(require,module,exports){
"use strict";
var Session = (function () {
    function Session(token) {
        this.token = token;
        this.claims = jwt_claims(token);
    }
    Session.prototype.iat = function () {
        return this.claims.iat;
    };
    Session.prototype.exp = function () {
        return this.claims.exp;
    };
    Session.prototype.halflife = function () {
        return (this.exp() - this.iat()) / 2;
    };
    return Session;
}());
exports.Session = Session;
function jwt_claims(jwt) {
    return JSON.parse(atob(jwt.split('.')[1]));
}

},{}],5:[function(require,module,exports){
"use strict";
var api_1 = require("./api");
var SessionManager = (function () {
    function SessionManager(store) {
        this.store = store;
    }
    Object.defineProperty(SessionManager.prototype, "session", {
        get: function () {
            return this.store.session;
        },
        enumerable: true,
        configurable: true
    });
    SessionManager.prototype.sessionIsActive = function () {
        return this.session.token.length > 0;
    };
    SessionManager.prototype.maintain = function () {
        var _this = this;
        if (!this.sessionIsActive()) {
            return;
        }
        var refreshAt = (this.session.iat() + this.session.halflife()) * 1000; // in ms
        var now = (new Date).getTime();
        // NOTE: if the client's clock is quite wrong, we'll end up being pretty aggressive about
        // maintaining their session on pretty much every page load.
        if (now < this.session.iat() || now >= refreshAt) {
            this.refresh();
        }
        else {
            setTimeout(function () { return _this.refresh(); }, refreshAt - now);
        }
    };
    SessionManager.prototype.refresh = function () {
        var _this = this;
        api_1.refresh().then(function (id_token) {
            _this.store.update(id_token);
            setTimeout(_this.refresh, _this.session.halflife() * 1000);
        }, function (error) {
            if (error === 'Unauthorized') {
                _this.store.delete();
            }
        });
    };
    return SessionManager;
}());
exports.SessionManager = SessionManager;

},{"./api":1}],6:[function(require,module,exports){
"use strict";
function get(url, queryString) {
    return jhr(function (xhr) {
        xhr.open("GET", url + "?" + queryString);
        xhr.send();
    });
}
exports.get = get;
function post(url, formData) {
    return jhr(function (xhr) {
        xhr.open("POST", url);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(formData);
    });
}
exports.post = post;
function jhr(sender) {
    return new Promise(function (fulfill, reject) {
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true; // enable authentication server cookies
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var data = (xhr.responseText.length > 1) ? JSON.parse(xhr.responseText) : {};
                if (data.result) {
                    fulfill(data.result);
                }
                else if (data.errors) {
                    reject(data.errors);
                }
                else {
                    reject(xhr.statusText);
                }
            }
        };
        sender(xhr);
    });
}

},{}]},{},[3])(3)
});