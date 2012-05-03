/*function run(test) {
    $("head").append($("<script type='text/javascript'>").attr("src", "js/" + test + ".js"));
    $("#tests").hide();
    $("#test-runner").show();
}*/

var readyCount = 0;
var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(n) {
    var str = [];
    for(var i=0; i<n; i++) str.push(CHARS.charAt(Math.floor(Math.random() * CHARS.length)));
    return str.join("");
}

function produce(key, value) {
    client.produce(key, value, function(error) {
        if(error) ok(false, "Error occurred on produce: " + error);
    });
}

function consume(pattern, timeout, expectedKey, expectedValue) {
    client.consume(pattern, timeout, function(error, key, value) {
        if(error) {
            ok(false, "Error occurred on consume: " + error);
        } else {
            equal(key, expectedKey);
            deepEqual(value, expectedValue);
            start();
        }
    });
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
    if(readyCount == 2) runTests();
}

function runTests() {
    testCore();
    testPatterns();
    testEmber();
}