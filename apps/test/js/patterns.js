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
        heap.patterns.rpcServer(client, "patterns/rpc", {
            silent: function(request) {
                ok(!request.error);
            },

            hello: function(request, name, age) {
                ok(!request.error);
                equal(name, "Joe");
                equal(age, 24);
                request.finish("Hello, " + name + " aged " + age);
            },

            badArgs: function(request) {
                ok(!request.error);
                equal(arguments.length, 1);
            }
        });

        var rpc = heap.patterns.rpcClient(client, "patterns/rpc");
        var noError = function(error) { ok(!error); }

        rpc("silent", { request: noError });

        rpc("hello", {
            request: noError,
            args: ["Joe", 24],

            response: function(error, value) {
                ok(!error);
                equal(value, "RPC");
            }
        });

        rpc("badArgs", {
            request: noError,
            args: {"bad": "arg"}
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