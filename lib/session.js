var request = require('request'),
_ = require('underscore'),
querystring = require('querystring'),
crypto = require('crypto');

var TinyCertCA = require('./ca.js'),
TinyCertManagement = require('./cert.js');

var TinyCertSession = function TinyCertSession(apiKey) {
    var sessionToken = null;

    var stringifyURIComponent = function stringifyURIComponent(key, val) {
        return encodeURIComponent(key).toString().replace('%20', '+') + '=' + encodeURIComponent(val).toString().replace('%20', '+');
    }

    /* Sign the parametrized target and construct query URI 
    * @see https://www.tinycert.org/docs/api/v1/auth
    */
    var signedRequest = function signedRequest(params) {
        // 1. sort parameters alphabetically
        var parameterKeys = _.keys(params).sort();
        // 2. URL-encode query string in that order
        var qs = _.map(parameterKeys, function(k) {
            var val = params[k];

            // allow nested arrays in the data
            if (Array.isArray(val)) {
                return _.map(val, function(curval, idx) {
                    var currentkey = k + '[' + idx + ']'
                    if (typeof curval === 'string') {
                        return currentkey + '=' + curval;
                    } else {
                        return _.map(curval, function(curval, nestedkey) {
                            return stringifyURIComponent(currentkey + '[' + nestedkey + ']', curval);
                        }).join('&');
                    }
                }).join('&');
            }

            // primitive
            return stringifyURIComponent(k, val);
        }).join('&');
        // 3. calculate hash
        var hmac = crypto.createHmac('sha256', apiKey);
        var calculatedHash = hmac.update(qs).digest('hex');

        // append hash as parameter 'digest' and construct the full URI
        return qs + '&digest=' + calculatedHash;
    };

    var apiRequest = function apiRequest(route, params, cb) {
        if (sessionToken) {
            params.token = sessionToken;
        }

        var request_data = signedRequest(params);
        var fullurl = 'https://www.tinycert.org/api/v1' + route;
        request.post({url: fullurl, headers: {'content-type' : 'application/x-www-form-urlencoded'}, body: request_data}, 
            function(error, response, data) {
                if (error) {
                    return cb(error, data, response);
                }
                if (response.statusCode !== 200) {
                    var err = new Error('HTTP-STATUS-' + response.statusCode + '\r\n' + response.body);
                    return cb(err, data, response);
                }
                if (data) data = JSON.parse(data);
                return cb(null, data, response);
            });
    };

    /* Initiate API session and retrieve session token */
    var tcConnect = function tcConnect(account, passphrase, cb) {
        var params = {
            email: account,
            passphrase: passphrase,
        };

        apiRequest('/connect', params, function(err, data, response) {
            if (err) return cb(err, data, response);

            // store token in current instance
            sessionToken = data.token;
            cb(null, data, response);
        });
    };

    /* Close API session */
    var tcDisconnect = function tcDisconnect(cb) {
        var params = {'token': sessionToken};

        apiRequest('/disconnect', params, function(err, data, response) {
            if (err) return cb(err, data, response);

            // forget session token
            sessionToken = null;
            cb(null, data, response);
        });
    };

    var expose = {
        _request: apiRequest,
        connect: tcConnect,
        disconnect: tcDisconnect
    }
    expose.CA = new TinyCertCA(expose);
    expose.Cert = new TinyCertManagement(expose);

    return expose;

}

module.exports = exports = TinyCertSession;
