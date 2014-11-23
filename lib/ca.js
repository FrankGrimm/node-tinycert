var _ = require('underscore');

var TinyCertCA = function TinyCertCA(tc) {
    var tcList = function tcList(cb) {
        tc._request('/ca/list', {}, cb);
    };
    
    var tcDetails = function tcDetails(ca_id, cb) {
        tc._request('/ca/details', {ca_id: ca_id}, cb);
    };

    var tcGet = function tcGet(ca_id, cb) {
        tc._request('/ca/get', {ca_id: ca_id, what: 'cert'}, function(err, data, response) {
            if (!err && data.pem) {
                return cb(null, data.pem, response);
            }
            return cb(err, data, response);
        });
    };

    var tcDelete = function tcDelete(ca_id, cb) {
        tc._request('/ca/delete', {ca_id: ca_id}, cb);
    };

    var tcNew = function tcNew(dname, sans, hash_method, cb) {
        cb = arguments[arguments.length - 1];
        if (!(hash_method) || hash_method instanceof Function) {
            hash_method = 'sha256';
        }
        if (sans instanceof Function) {
            sans = null;
        }

        var params = _.clone(dname);
        params.hash_method = hash_method;
        if (sans) {
            params.SANs = sans;
        }
        tc._request('/ca/new', params, cb);
    };

    return {
        list: tcList,
        details: tcDetails,
        get: tcGet,
        remove: tcDelete,
        create: tcNew,
        }
};

module.exports = exports = TinyCertCA;
