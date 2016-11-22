(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var verbs_1 = require("./verbs");
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
            verbs_1.post(url('/accounts'), formData(credentials))
                .then(function (result) { return fulfill(result.id_token); }, function (errors) { return reject(errors); }).then(function () { return inflight = false; });
        });
    },
    isAvailable: function (username) {
        return verbs_1.get(url('/accounts/available'), formDataItem('username', username));
    },
    refresh: function () {
        return verbs_1.get(url('/sessions/refresh'), '')
            .then(function (result) { return result.id_token; });
    },
    login: function (credentials) {
        return verbs_1.post(url('/sessions'), formData(credentials))
            .then(function (result) { return result.id_token; });
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = KeratinAuthN;
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
var inflight = false;

},{"./verbs":2}],2:[function(require,module,exports){
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

},{}]},{},[1]);
