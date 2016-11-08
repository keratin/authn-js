'use strict';

var Promise = require('promise');

var AuthAPI = {
  ISSUER: '',
  inflight: false,

  accounts_url: function accounts_url() {
    if (!this.ISSUER.length) {
      throw "AuthAPI.ISSUER not set";
    }
    return this.ISSUER + '/accounts';
  },

  signup: function signup(username, password) {
    var formData = "username=" + encodeURIComponent(username) + "&" +
                   "password=" + encodeURIComponent(password);

    return new Promise(function (fulfill, reject) {
      if (AuthAPI.inflight) {
        reject();
        return;
      } else {
        AuthAPI.inflight = true;
      }

      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE) {
          var data = JSON.parse(xhr.responseText);
          if (data.result) {
            fulfill(data.result.id_token);
          } else if (data.errors) {
            reject(data.errors);
          } else {
            reject();
          }
          AuthAPI.inflight = false;
        }
      };
      xhr.open("POST", AuthAPI.accounts_url());
      xhr.send(formData);
    });
  }
};

module.exports = AuthAPI;
