var queues = require("mysql-queues"),
    crypto = require("crypto"),
    fs = require("fs"),
    config = require("./config");

module.exports = function(file, client) {
    var seed = JSON.parse(fs.readFileSync(process.argv[2]));

    queues(client, config.debug);
    var trans = client.startTransaction();
    var totalUpdates = 0, updatesCount = 0;

    function query(log, query, params, callback) {
        console.log(log);
        totalUpdates++;

        trans.query(query, params, function(error, results) {
            if(error && !trans.rolledback) {
                console.error("Database error:", error);
                trans.rollback();
                process.exit(-1);
            } else if(callback) {
                callback(results);
                updatesCount++;

                if(updatesCount == totalUpdates) {
                    console.log("Seeding completed");
                    trans.commit();
                }
            }
        });
    }

    function getGroupId(group, callback) {
        query("Getting group ID for " + group, "SELECT id FROM groups WHERE name=?", [group], function(results) {
            if(!results || results.length == 0 || results[0].count == 0) {
                query("Adding group " + group, "INSERT INTO groups (name) VALUE (?)", [group], function(results) {
                    callback(results.insertId);
                });
            } else {
                callback(results[0].id);
            }    
        });
    }

    function getUserId(username, password, callback) {
        var sha = crypto.createHash('sha256');
        sha.update(password);
        var hash = sha.digest('base64');

        query("Getting user ID for " + username, "SELECT id FROM users WHERE name=?", [username], function(results) {
            if(!results || results.length == 0 || results[0].count == 0) {
                query("Adding user " + username, "INSERT INTO users (name, password_hash) VALUES (?, ?)", [username, hash], function(results) {
                    callback(results.insertId);
                });
            } else {
                var userId = results[0].id;
                query("Setting password for user " + username, "UPDATE users SET password_hash=? WHERE id=?", [hash, userId]);
                callback(userId);
            }    
        });
    }

    function setPrivileges(group, groupId, config) {
        var addPrivileges = function(type, config) {
            if(!config) return;

            for(var i=0; i<config.length; i++) {
                query("Adding privilege for group " + group + ": " + config[i], "INSERT INTO privileges (group_id, key_pattern, key_type) VALUES (?, ?, ?)", [groupId, config[i], type]);
            }
        }

        query("Clearing privileges for group " + group, "DELETE FROM privileges WHERE group_id=?", [groupId], function() {
            addPrivileges("simple", config.simpleKeyPermissions);
            addPrivileges("complex", config.complexKeyPermissions);
        });
    }

    function seedUser(user, config) {
        var addUserGroup = function(userId, group) {
            getGroupId(group, function(groupId) {
                query("Adding user/group mapping " + user + " => " + group, "INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)", [userId, groupId]);
            });
        };

        getUserId(user, config.password, function(userId) {
            query("Clearing user/group mappings for user " + user, "DELETE FROM user_groups WHERE user_id=?", [userId]);

            for(var i=0; i<config.groups.length; i++) {
                var group = config.groups[i];
                addUserGroup(userId, group);
            }
        });
    }

    function seedGroup(group, config) {
        getGroupId(group, function(groupId) {
            setPrivileges(group, groupId, config);
        });
    }

    for(var group in seed.groups) {
        seedGroup(group, seed.groups[group]);
    }

    for(var user in seed.users) {
        seedUser(user, seed.users[user]);
    }

    trans.execute();
};