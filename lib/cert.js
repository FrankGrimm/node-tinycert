var _ = require('underscore');

var TinyCertManager = function TinyCertManager(tc) {
    var tcList = function tcList(ca_id, what, cb) {
        cb = arguments[arguments.length - 1]
        if (!what || what instanceof Function) {
            what = 15; // default to ALL certificates
        }
        tc._request('/cert/list', {ca_id: ca_id, what: what}, cb);
    };

    var tcDetails = function tcDetails(cert_id, cb) {
        tc._request('/cert/details', {cert_id: cert_id}, cb);
    };
    
    // valid subjects for what: cert, chain, csr, key.dec, key.enc
    var tcGet = function tcGet(cert_id, what, cb) {
        cb = arguments[arguments.length - 1];
        if (what instanceof Function) what = null;
        if (!what) what = 'cert';
        tc._request('/cert/get', {cert_id: cert_id, what: what}, function(err, data, response) {
            if (!err && data.pem) {
                return cb(null, data.pem, response);
            }
            return cb(err, data, response);
        });
    };

    var tcReissue = function tcReissue(cert_id, cb) {
        tc._request('/cert/reissue', {cert_id: cert_id}, function(err, data, response) {
            if (!err && data && data.cert_id) {
                return cb(null, data.cert_id, response);
            }
            return cb(err, data, response);
        });
    };

    // valid values for new_status: good, hold, revoked
    var tcStatus = function tcStatus(cert_id, new_status, cb) {
        tc._request('/cert/status', {cert_id: cert_id, status: new_status}, cb);
    };

    var tcNew = function tcNew(ca_id, dname, sans, cb) {
        cb = arguments[arguments.length - 1];
        if (sans && sans instanceof Function) {
            sans = null;
        }

        var params = _.clone(dname);
        params.ca_id = ca_id;
        if (sans) {
            params.SANs = sans;
        }
        tc._request('/cert/new', params, function(err, data, response) {
            if (!err && data.cert_id) {
                return cb(null, data.cert_id, response);
            }
            return cb(err, data, response);
        });
    };

    return {
        list: tcList,
        details: tcDetails,
        get: tcGet,
        reissue: tcReissue,
        status: tcStatus,
        create: tcNew,
        CERTSTATUS: {
            expired: 1,
            good: 2,
            revoked: 4,
            hold: 8,
        }
    }
};

module.exports = exports = TinyCertManager;
