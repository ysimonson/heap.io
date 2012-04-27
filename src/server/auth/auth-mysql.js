var mysql = require("mysql"),
    base = require("./auth-base"),
    util = require("util"),
    crypto = require("crypto"),
    str = require("../str");

var GET_PRIVILEGES_QUERY = "SELECT privileges.key_pattern AS key_pattern, privileges.key_type AS key_type FROM privileges, user_groups WHERE privileges.group_id=user_groups.group_id AND user_groups.user_id=?";
var GET_USER_ID_QUERY = "SELECT id FROM users WHERE name=? AND password_hash=? LIMIT 1";

function User(client, id, username, privilegesSleepTime, readyCallback) {
    this._client = client;
    this.id = id;
    this.username = username;
    this._simplePrivileges = {};
    this._complexPrivileges = [];
    
    this.getPrivileges(readyCallback);

    var self = this;
    setInterval(function() { self.getPrivileges(); }, privilegesSleepTime);
}

User.prototype.getPrivileges = function(callback) {
    var self = this;

    self._client.query(GET_PRIVILEGES_QUERY, [self.id], function(error, results) {
        if(error) {
            console.error("Could not fetch privileges data:", error);
            if(callback) callback("Could not fetch privileges data");
        } else {
            self._simplePrivileges = {};
            self._complexPrivileges = [];

            for(var i=0; i<results.length; i++) {
                var result = results[i];

                if(result.key_type == 'complex') {
                    try {
                        self._complexPrivileges.push(new RegExp(result.key_pattern));
                    } catch(e) {
                        console.error("Could not compile complex privilege key:", e);
                    }
                } else {
                    self._simplePrivileges[result.key_pattern] = true;
                }
            }

            if(callback) callback();
        }
    });
}

User.prototype._keyAllowed = function(key) {
    if(key in this._simplePrivileges) return true;

    for(var i=0; i<this._complexPrivileges.length; i++) {
        if(str.fullMatch(this._complexPrivileges[i], key)) {
            return true;
        }
    }

    return false;
}

User.prototype.canProduce = function(key) {
    return this._keyAllowed(key);
};

User.prototype.canConsume = function(key) {
    return this._keyAllowed(key);
};

function Authorizer(config) {
    base.Authorizer.call(this, config);
    this._client = mysql.createClient(config);
}

util.inherits(Authorizer, base.Authorizer);

Authorizer.prototype.authenticate = function(username, password, callback) {
    //We want to generate the hash BEFORE looking up in the database to prevent
    //timing attacks
    var self = this;

    var sha = crypto.createHash('sha256');
    sha.update(password);
    var hash = sha.digest('base64');

    self._client.query(GET_USER_ID_QUERY, [username, hash], function(error, results) {
        if(error) {
            console.error("Could not fetch user data:", error);
            callback("Could not fetch user data");
        } else if(!results || results.length == 0) {
            callback("Authentication failed");
        } else {
            var userId = results[0].id;

            var user = new User(self._client, userId, username, self.config.privilegesSleepTime, function(error) {
                if(error) {
                    callback("Could not fetch user privileges");
                } else {
                    callback(null, user);
                }
            });
        }
    });
};

exports.Authorizer = Authorizer;