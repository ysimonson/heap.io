DS.HeapIOAdapter = DS.Adapter.extend({
    _rpc: null,

    init: function() {
        var client = this.get('client');
        var namespace = this.get('namespace');
        this.set('_rpc', heap.rpcClient(client, namespace));
    },

    _request: function(method, args, callback) {
        var rpc = this.get('_rpc');

        rpc(method, {
            args: args,

            response: function(error, value) {
                if(error) {
                    throw new Error(error);
                } else {
                    callback(value);
                }
            }
        });
    },

    createRecord: function(store, type, record) {
        this._request("create", [type.toString(), record.toJSON()], function(value) {
            store.didCreateRecord(record, value);
        });
    },

    updateRecord: function(store, type, record) {
        this._request("update", [type.toString(), record.toJSON()], function(value) {
            store.didUpdateRecord(record, value);
        });
    },

    deleteRecord: function(store, type, record) {
        this._request("delete", [type.toString(), record.toJSON()], function(value) {
            store.didDeleteRecord(record);
        });
    },

    find: function(store, type, id) {
        this._request("search", [type.toString(), {id: id}], function(value) {
            store.loadMany(type, value);
        });
    },

    findAll: function(store, type) {
        this._request("search", [type.toString()], function(value) {
            store.loadMany(type, value);
        });
    },

    findQuery: function(store, type, query, modelArray) {
        this._request("search", [type.toString(), query], function(value) {
            console.log("ASDASD", value);
            modelArray.load(value);
        });
    }
});