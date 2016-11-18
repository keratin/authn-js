'use strict';
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
        return get(url('/accounts/available'), formDataItem('username', username))
            .then(function (result) { return result.available; });
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
        var jwt = readCookie(cookieName);
        if (jwt) {
            var claims = jwt_claims(jwt);
            var halflife = (claims.exp - claims.iat) / 2;
            var refreshAt = (claims.iat + halflife) * 1000; // in ms
            var now = (new Date).getTime();
            // NOTE: if the client's clock is quite wrong, we'll end up being pretty aggressive about
            // maintaining their session on pretty much every page load.
            if (now < claims.iat || now >= refreshAt) {
                refreshSession(cookieName);
            }
            else {
                setTimeout(function () { return refreshSession(cookieName); }, refreshAt - now);
            }
        }
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = KeratinAuthN;
function readCookie(cookieName) {
    return document.cookie.replace("(?:(?:^|.*;s*)" + cookieName + "s*=s*([^;]*).*$)|^.*$", "$1");
}
function deleteCookie(cookieName) {
    document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
function refreshSession(cookieName) {
    KeratinAuthN.refresh().then(function (id_token) {
        var secureFlag = (window.location.protocol === 'https:') ? '; secure' : '';
        document.cookie = cookieName + "=" + id_token + secureFlag;
        var claims = jwt_claims(id_token);
        var halflife = (claims.exp - claims.iat) / 2;
        setTimeout(function () { return refreshSession(cookieName); }, halflife * 1000);
    }, function (error) {
        if (error === 'Unauthorized') {
            deleteCookie(cookieName);
        }
    });
}
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
