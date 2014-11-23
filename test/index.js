var TinyCertSession = require('../index.js'),
_ = require('underscore'),
util = require('util');

console.log('Checking environment');
var apiKey = null,
passphrase = null,
account = null;

if (process.env.TC_APIKEY) {
    apiKey = process.env.TC_APIKEY;
} else {
    console.log('Missing TC_APIKEY environment variable');
    process.exit(-2);
}

if (process.env.TC_PASSPHRASE) {
    passphrase = process.env.TC_PASSPHRASE;
} else {
    console.log('Missing TC_PASSPHRASE environment variable');
    process.exit(-2);
}
if (process.env.TC_ACCOUNT) {
    account = process.env.TC_ACCOUNT;
} else {
    console.log('Missing TC_ACCOUNT environment variable');
    process.exit(-2);
}

console.log('Environment OK');

var handle_error = function handle_error(err) {
    if (err) {
        console.log('error', err);
        process.exit(-1);
    }
}

console.log('Initializing test session');
var tc = new TinyCertSession(apiKey);
tc.connect(account, passphrase, function(err) {
    handle_error(err);
    console.log('Connected to account <' + account + '>');

    tc.CA.create({C: 'US', O: 'node-tinycert testca', L: 'Interweb', ST: 'state'}, function(err, ca_data) {
        handle_error(err);
        console.log('Created test CA: ' + ca_data.ca_id);
        var test_ca_id = ca_data.ca_id;

        tc.CA.list(function(err, calist) {
            handle_error(err);
            console.log('CA list:');
            console.log(calist);

            var test_ca_id = null;
            _.forEach(calist, function(ca_info) {
                if (!test_ca_id && ca_info.name == 'node-tinycert testca') {
                    test_ca_id = ca_info.id;
                };
            });
            if (!test_ca_id) {
                console.log('Test CA not found. skipping further tests');
                process.exit(-1);
            }

            tc.CA.details(test_ca_id, function(err, ca_details) {
                handle_error(err);
                console.log('CA details: ' + _.map(ca_details, function(val, key) { if (val) { return key + ': ' + val; } else { return ''; } }).join(' '));

                tc.CA.get(test_ca_id, function(err, pem) {
                    handle_error(err);
                    console.log('CA PEM: ' + pem);

                    tc.Cert.create(test_ca_id, {'C': 'US', 'CN': 'Testcert #1', 'O': 'Testorg'}, [{'email': 'foobar@example.com'}], function(err, cert_id) {
                        handle_error(err);
                        console.log('Certificate issued: ' + cert_id);
                        var test_cert_id = cert_id;

                        tc.Cert.list(test_ca_id, function(err, certlist) {
                            handle_error(err);
                            console.log('Certs in test CA:');
                            _.forEach(certlist, function(certinfo) {
                                console.log('#' + certinfo.id + ' status: ' + certinfo.status + ' name: "' + certinfo.name + '" expires: ' + new Date(certinfo.expires*1000));
                            });

                            tc.Cert.details(test_cert_id, function(err, cert_details) {
                                handle_error(err);
                                console.log('Certificate details: ' + _.map(cert_details, function(val, key) { if (val) { return key + ': ' + util.inspect(val); } else { return ''; } }).join(' '));

                                tc.Cert.get(test_cert_id, 'chain', function(err, pem) {
                                    handle_error(err);
                                    console.log('Certificate chain');
                                    console.log(pem);

                                    tc.Cert.reissue(test_cert_id, function(err, new_cert_id) {
                                        handle_error(err);
                                        console.log('Certificate reissued. Old id: ' + test_cert_id + ' new certificate: ' + new_cert_id);

                                        tc.Cert.status(new_cert_id, 'revoked', function(err) {
                                            handle_error(err);
                                            console.log('Reissued certificate is now revoked');

                                            tc.CA.remove(test_ca_id, function(err) {
                                                handle_error(err);
                                                console.log('Test CA deleted');

                                                tc.disconnect(function(err) {
                                                    handle_error(err);
                                                    console.log('Disconnected API session');
                                                    process.exit(0);
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

    });
});

