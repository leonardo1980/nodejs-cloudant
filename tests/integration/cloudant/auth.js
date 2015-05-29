// Licensed under the Apache License, Version 2.0 (the 'License'); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

'use strict';

var helpers = require('../../helpers/integration');
var harness = helpers.harness(__filename, helpers.noopTest, helpers.noopTest);
var it = harness.it;
var Cloudant = helpers.Cloudant;

it('pings the server', function(assert) {
  var client = Cloudant({account:'nodejs'});
  client.request('', function (er, body, headers) {
    assert.equal(er, null, 'Ping Cloudant');
    assert.equal(headers.statusCode, 200, 'Cloudant ping status OK');
    assert.equal(body.couchdb, 'Welcome', 'Welcome message from Cloudant ping');
    assert.ok(body.version, 'Cloudant version string');
    assert.end();
  });
});
/////////////
var specify  = require('specify')
  , helpers  = require('../helpers')
  , timeout  = helpers.timeout
  , nock     = helpers.nock
  , Cloudant = helpers.Cloudant
  ;

var auth_mock = nock(helpers.cloudant_auth, "cloudant/auth");
var serv_mock = nock(helpers.cloudant_url , "cloudant/auth_me");

var third_party = {key:null, password:null};

specify('cloudant:generate_api_key', timeout, function (assert) {
  var client = Cloudant({account:'nodejs'}) // No password

  var pw_error = null
  try        { client.generate_api_key(function() {}) }
  catch (er) { pw_error = er }
  assert.ok(pw_error, 'Throw an error if a password is not provided');

  client = Cloudant({account:'nodejs', password:helpers.cloudant_pw()})
  client.generate_api_key(function(er, body) {
    assert.equal(er, undefined, 'Hit the generate_api_key endpoint');
    assert.equal(body.ok, true, 'Good response generating API key');
    assert.ok(body.key        , 'Good API key');
    assert.ok(body.password   , 'Good API password');

    // Store this for later, to grant permissions to this third party.
    third_party.key = body.key;
    third_party.password = body.password;
  });
});

specify('cloudant:third_party_access', timeout, function (assert) {
  Cloudant({account:'nodejs', key:third_party.key, password:third_party.password}, function(er, cloudant, body) {
    assert.equal(er, undefined, 'Connect and authenticate using the new API key');
    assert.ok(body && body.userCtx, 'Third-party connect got a good pong');
    assert.equal(body.userCtx.name, third_party.key, 'Third-party correctly identified by Cloudant server');
  })
});

specify('cloudant:access_with_username', timeout, function (assert) {
  Cloudant({account:'nodejs', username:third_party.key, password:third_party.password}, function(er, cloudant, body) {
    assert.equal(er, undefined, 'Connect and authenticate using a username');
    assert.ok(body && body.userCtx, 'Connect with a username got a good pong');
    assert.equal(body.userCtx.name, third_party.key, 'Username correctly identified by Cloudant server');
  })
});

specify('cloudant:set_permissions', timeout, function (assert) {
  var client = Cloudant({account:'nodejs'}) // No password

  var pw_error = null
  try        { client.set_permissions({}, function() {}) }
  catch (er) { pw_error = er }
  assert.ok(pw_error, 'Throw an error if a password is not provided');

  var opts = {database:'third_party_db', username:third_party.key, roles:['_reader','_writer']};
  client = Cloudant({account:'nodejs', password:helpers.cloudant_pw()})
  client.set_permissions(opts, function(er, body) {
    assert.equal(er, undefined, 'Hit the generate_api_key endpoint');
    assert.equal(body.ok, true, 'Good response setting permissions');
  });
});

specify.run(process.argv.slice(2));
