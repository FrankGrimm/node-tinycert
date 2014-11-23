node-tinycert
=============

tinycert API wrapper for node.js

API documentation (and your API key) available at: https://www.tinycert.org/docs/api

## library usage

First, require the library:
```javascript
var tc = require('node-tinycert');
```
Then, connect to your account via email, passphrase and API key:
```javascript
var tc = new TinyCertSession(apiKey);
tc.connect(account, passphrase, function(err) {
    if (err) {
        console.log(err);
        return;
    };
    console.log('Connected to account <' + account + '>');
}
```
## Example code

A full example of all supported functions can be found in test/index.js 

Please note that, as of this writing, the /ca/new endpoint generates broken certificates and fails with HTTP status code 500.

