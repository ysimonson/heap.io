function testCore() {
    module("Core");

    asyncTest("Non-existent simple consume", function() {
        consume("does not exist", 1, null, null);
    });

    asyncTest("Non-existent complex consume", function() {
        consume(/c.mpl.x/, 1, null, null);
    });

    asyncTest("Simple produce-consume", function() {
        produce("simple pc", {value: 1});
        consume("simple pc", 0, "simple pc", {value: 1});
    });
    
    asyncTest("Simple consume-produce", function() {
        consume("simple cp", 0, "simple cp", {value: 2});
        produce("simple cp", {value: 2});
    });

    asyncTest("Complex produce-consume", function() {
        produce("complex pc", {value: 3});
        consume(/c.mpl.x pc/, 0, "complex pc", {value: 3});
    });

    asyncTest("Complex consume-produce", function() {
        consume(/c.mpl.x cp/, 0, "complex cp", {value: 4});
        produce("complex cp", {value: 4});
    });

    asyncTest("Unauthorized key - produce", function() {
        client.produce("unauthorized", "test", function(error) {
            ok(error);
            start();
        });
    });

    asyncTest("Unauthorized key - consume", function() {
        client.consume("unauthorized", 1, function(error) {
            ok(error);
            start();
        });
    });

    test("Empty key", function() {
        raises(function() { produce("", ""); });
    });

    test("Too big key", function() {
        raises(function() { produce("random/" + randomString(4090), ""); });
    });

    test("Non-string key", function() {
        raises(function() { produce(true, ""); })
    });

    asyncTest("Big key", function() {
        var key = "random/" + randomString(4089);
        produce(key, {value: 5});
        consume(key, 0, key, {value: 5}, true);
    });

    test("Big value", function() {
        raises(function() { produce(randomString(8001), ""); })
    });
}