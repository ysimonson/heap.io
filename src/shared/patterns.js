__inject_to__ = (function() {
    return {
        rpc: function(heap, namespace) {
            if(namespace.length && namespace.indexOf(namespace.length - 1) == "/") {
                namespace = namespace.substring(0, namespace.length - 1);
            }

            this.heap = heap;
            this.namespace = namespace;
            this.requestId = 0;

            return function(name, options) {
                var produceNamespace = [namespace, name].join("/");
                var produceRequestId = this.requestId++;

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
                        options.response(error, value);
                    });
                }
            };
        },

        loop: function(heap, key, callback) {
            var receiver = function(error, consumedKey, consumedValue) {
                callback(error, consumedKey, consumedValue);
                heap.consume(key, 0, receiver);
            };

            heap.consume(key, 0, receiver);
        }
    };
})();