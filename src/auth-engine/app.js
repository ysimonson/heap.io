//TODO: send responses to the user

var heapio = require("./heap.io/heap.io"),
    mysql = require("mysql"),
    config = require("./config").config,
    seeder = require("./seeder");

var heap = new heapio.HeapIO();
var client = mysql.createClient(config.auth);

heap.on("error", function(error) {
    console.error("Heap.IO Error:", error);
});

if(process.argv.length > 2) seeder(process.argv[2], client);

function loop(eventPattern, callback) {
    var receiver = function(error, key, value) {
        if(error) {
            console.error("Heap.IO Error: " + error);
        } else {
            callback(key, value);
            heap.consume(eventPattern, 0, receiver);
        }
    };

    heap.consume(eventPattern, 0, receiver);
}

//TODO: add ability to add users

/*loop("__heap.io/auth/group/add", function(e) {
    client.query("INSERT INTO groups (name) VALUE (?)", [e.group]);
});

loop("__heap.io/auth/group/remove", function(e) {
    client.query("DELETE FROM groups WHERE name=?", [e.group]);
});

loop("__heap.io/auth/privileges/add", function(e) {
    var query = "SELECT count(privileges.group_id) FROM privileges, groups WHERE privileges.group_id=groups.id AND groups.name=? AND privileges.key_pattern=? AND privileges.key_type=?";
    var params = [e.group, e.key, e.keyType];

    client.query(query, params, function(error, results) {
        if(error) {
            console.error("Could not check current privileges:", error);
        } else if(!results) {
            var query = "INSERT INTO privileges (SELECT id FROM groups WHERE name=?), key_pattern, key_type) VALUES (?, ?, ?)";
            var params = [e.group, e.key, k.keyType];
            client.query(query, params, function(error) {
                if(error) console.error("Could not update current privileges:", error);
            });
        }
    });
});

loop("__heap.io/auth/privileges/remove", function(e) {
    var query = "DELETE FROM privileges WHERE group_id=(SELECT id FROM groups WHERE name=?) AND key_pattern=? AND key_type=?";
    var params = [e.group, e.key, e.key_type];
    client.query(query, params, function(error) {
        if(error) console.error("Could not remove privileges:", error);
    });
});*/