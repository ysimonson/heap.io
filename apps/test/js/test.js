var readyCount = 0;
var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(n) {
    var str = [];
    for(var i=0; i<n; i++) str.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
    return str.join("");
}

function produce(key, value) {
    client.produce(key, value, function(error) {
        ok(!error);
    });
}

function consume(pattern, timeout, expectedKey, expectedValue) {
    client.consume(pattern, timeout, function(error, key, value) {
        ok(!error);
        equal(key, expectedKey);
        deepEqual(value, expectedValue);
        start();
    });
}

//TODO: provide a more robust way of testing XHR support
if(window.location.hash == "#xhr") {
    console.log("Killing websocket support");
    window.WebSocket = undefined;
}

var client = new heap.IO("http://localhost:8080", "test", "test-password", function(error) {
    module("Basics");

    test("Created", function() {
        ok(!error);
    })

    ready();
});

$(ready);

function ready() {
    readyCount++;

    if(readyCount == 2) {
        testCore();
        testPatterns();
        testEmber();
    }
}