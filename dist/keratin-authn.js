'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function () {
    var KeratinAuthN = {
        ISSUER: '',
        signup: function (credentials) {
            return new Promise(function (fulfill, reject) {
                if (inflight) {
                    reject("duplicate");
                    return;
                }
                else {
                    inflight = true;
                }
                post(url('/accounts'), formData(credentials))
                    .then(function (result) { return fulfill(result.id_token); }, function (errors) { return reject(errors); }).then(function () { return inflight = false; });
            });
        },
        isAvailable: function (username) {
            return get(url('/accounts/available'), formDataItem('username', username));
        },
        // If you are building a single-page app and can keep the session token in localStorage, use
        // this function. If your system depends on cookies to maintain session, consider using
        // KeratinAuthN.maintainSession() instead.
        refresh: function () {
            return get(url('/sessions/refresh'), '')
                .then(function (result) { return result.id_token; });
        },
        login: function (credentials) {
            return post(url('/sessions'), formData(credentials))
                .then(function (result) { return result.id_token; });
        },
        // If your system depends on cookies to maintain session, this will keep them up to date. If you
        // are building a single-page app and can keep the session token in localStorage, look instead at
        // KeratinAuthN.refresh().
        maintainSession: function (cookieName) {
            var manager = new SessionManager(new CookieSessionStore(cookieName));
            if (manager.session.token.length) {
                manager.maintain();
            }
        }
    };
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
    var CookieSessionStore = (function () {
        function CookieSessionStore(cookieName) {
            this.sessionName = cookieName;
            this.secureFlag = (window.location.protocol === 'https:') ? '; secure' : '';
            this.session = new Session(document.cookie.replace("(?:(?:^|.*;s*)" + this.sessionName + "s*=s*([^;]*).*$)|^.*$", "$1"));
        }
        CookieSessionStore.prototype.update = function (val) {
            this.session = new Session(val);
            document.cookie = this.sessionName + "=" + val + this.secureFlag;
        };
        CookieSessionStore.prototype.delete = function () {
            document.cookie = this.sessionName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        };
        return CookieSessionStore;
    }());
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
        SessionManager.prototype.maintain = function () {
            var _this = this;
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
            KeratinAuthN.refresh().then(function (id_token) {
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
    function jwt_claims(jwt) {
        return JSON.parse(atob(jwt.split('.')[1]));
    }
    function url(path) {
        if (!KeratinAuthN.ISSUER.length) {
            throw "KeratinAuthN.ISSUER not set";
        }
        return "" + KeratinAuthN.ISSUER + path;
    }
    function formData(credentials) {
        return formDataItem('username', credentials.username) + "&" + formDataItem('password', credentials.password);
    }
    function formDataItem(k, v) {
        return k + "=" + encodeURIComponent(v);
    }
    function get(url, queryString) {
        return jhr(function (xhr) {
            xhr.open("GET", url + "?" + queryString);
            xhr.send();
        });
    }
    function post(url, formData) {
        return jhr(function (xhr) {
            xhr.open("POST", url);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send(formData);
        });
    }
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
    var inflight = false;
    return KeratinAuthN;
})();
