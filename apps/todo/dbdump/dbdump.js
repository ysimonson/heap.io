var heapio = require("./heap.io/heap.io"),
    mysql = require("mysql");

var db = mysql.createClient({user: 'todo', password: 'hackday', database: 'todos'});

var heap = new heapio.HeapIO();

heap.on("error", function(error) {
    console.error("Heap.IO Error:", error);
});

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

loop("todo", function(key, value) {
    db.query("INSERT INTO todos (item) VALUE (?)", [value], function(error) {
        if(error) console.error("MySQL Error:", error);
    });
});

loop("existing-todos", function(key, value) {
    db.query("SELECT * FROM todos", [], function(error, results) {
        if(error) {
            console.error("MySQL Error:", error);
        } else {
            heap.produce("existing-todos", results);
        }
    });
});