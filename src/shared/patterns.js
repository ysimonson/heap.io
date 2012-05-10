__inject_to__ = (function() {
    var fixNamespace = function(namespace) {
        if(namespace.length && namespace.indexOf(namespace.length - 1) == "/") {
            return namespace.substring(0, namespace.length - 1);
        } else {
            return namespace;
        }
    };

    var rpcClient = function(heap, namespace) {
        namespace = fixNamespace(namespace);
        var requestId = 0;

        return function(name, options) {
            var produceNamespace = [namespace, name].join("/");
            var produceRequestId = requestId++;

            var producePayload = {
                username: heap.username,
                requestId: produceRequestId,
                args: options.args || []
            };

            var produceCallback = options.request ? options.request : function(error) {
                if(error) throw new Error(error);
            };

            heap.produce(produceNamespace, producePayload, produceCallback);

            if(options.response) {
                var consumeNamespace = [produceNamespace, heap.username, produceRequestId];

                heap.consume(consumeNamespace.join("/"), options.timeout || 0, function(error, key, value) {
                    var args = [error].concat(value);
                    options.response.apply(this, args);
                });
            }
        };
    };

    var rpcServer = function(heap, namespace, context) {
        namespace = fixNamespace(namespace);

        var listenFor = function(name, method) {
            var consumeNamespace = [namespace, name].join("/");

            loop(heap, consumeNamespace, function(error, key, value) {
                var requestData = {error: error, username: null, requestId: null};
                var args = [];

                if(value) {
                    requestData.username = value.username;
                    requestData.requestId = value.requestId;
                    if(value.args instanceof Array) args = value.args;
                }

                requestData.finish = function() {
                    var produceNamespace = [consumeNamespace, requestData.username, requestData.requestId];
                    var args = Array.prototype.slice.call(arguments);
                    heap.produce(produceNamespace.join("/"), args);
                };

                method.apply(this, [requestData].concat(args));
            });
        };

        for(var methodName in context) {
            var method = context[methodName];

            if(typeof(method) == 'function') {
                listenFor(methodName, method);
            }
        }
    };

    var LOOP_ERROR_SLEEP_TIME = 1000;

    var loop = function(heap, key, callback, successSleepTime, errorSleepTime) {
        if(!successSleepTime) successSleepTime = 0;
        if(!errorSleepTime) errorSleepTime = LOOP_ERROR_SLEEP_TIME;

        var receiver = function(error, consumedKey, consumedValue) {
            callback(error, consumedKey, consumedValue);

            setTimeout(function() {
                heap.consume(key, 0, receiver);
            }, error ? errorSleepTime : successSleepTime);
        };

        heap.consume(key, 0, receiver);
    };

    return {
        rpcClient: rpcClient,
        rpcServer: rpcServer,
        loop: loop
    };
})();