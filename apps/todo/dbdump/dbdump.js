var heap = require("./heap.io/heap.io"),
    mysql = require("mysql");

var db = mysql.createClient({user: 'todo', password: 'hackday', database: 'todos'});
var client = new heap.IO();

client.on("error", function(error) {
    console.error("Heap.IO Error:", error);
});

heap.loop(client, "todo", function(error, key, value) {
    if(error) {
        console.error("Heap.IO error:", error);
    } else {
        db.query("INSERT INTO todos (item) VALUE (?)", [value], function(error) {
            if(error) console.error("MySQL Error:", error);
        });
    }
});

heap.loop(client, "existing-todos", function(error, key, value) {
    if(error) {
        console.error("Heap.IO error:", error);
    } else {
        db.query("SELECT * FROM todos", [], function(error, results) {
            if(error) {
                console.error("MySQL error:", error);
            } else {
                client.produce("existing-todos", results);
            }
        });
    }
});
