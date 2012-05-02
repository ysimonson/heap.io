function testPatterns() {
    module("Patterns");

    asyncTest("Loop", function() {
        var loopCount = 0;
        var matcher = /^patterns\/loop\/.+/;

        heap.patterns.loop(client, matcher, function(error, key, value) {
            ok(!error);
            ok(matcher.test(key));
            ok(value == 1 || value == 2);

            loopCount++;
            if(loopCount == 2) start();
        });

        setTimeout(function() {
            if(loopCount < 2) {
                ok(false, "Loop did not execute within 1s");
                start();
            }
        }, 1000);

        client.produce("patterns/loop/1", 1);
        client.produce("patterns/loop/2", 2);
    });

    asyncTest("RPC", function() {
        client.consume("patterns/rpc/silent", 0, function(error, key, value) {
            ok(!error);
        });  

        client.consume("patterns/rpc/hello", 0, function(error, key, value) {
            ok(!error);
            equal(value.args, "RPC");
            client.produce("patterns/rpc/foo2/" + value.username + "/" + value.requestId, "RPC");
        });  

        var rpc = heap.patterns.rpc(client, "patterns/rpc");
        var noError = function(error) { ok(!error); }

        rpc("silent", { request: noError });

        rpc("hello", {
            request: noError,
            args: "RPC",
            response: function(error, value) {
                ok(!error);
                equal(value, "RPC");
            }
        });

        rpc("ignored", {
            timeout: 100,
            request: noError,
            response: function(error, value) {
                ok(!error);
                equal(value, null);
            }
        });

        setTimeout(start, 1000);
    });
}