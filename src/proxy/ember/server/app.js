var NAMESPACE = "ember-data",
    ADAPTER = "stupid-adapter";

var heap = require("./heap.io/heap.io"),
    adapter = require("./" + ADAPTER);

var client = new heap.IO();

client.on("error", function(error) {
    console.error("Heap.IO Error:", error);
});

heap.rpcServer(client, NAMESPACE, adapter);
