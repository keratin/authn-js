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
