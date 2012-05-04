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
        this._request("create", [type, record], function(value) {
            store.didCreateRecord(record, value);
        });
    },

    updateRecord: function(store, type, record) {
        this._request("update", [type, record], function(value) {
            store.didUpdateRecord(record, value);
        });
    },

    deleteRecord: function(store, type, record) {
        this._request("delete", [type, record], function(value) {
            store.didDeleteRecord(value);
        });
    },

    find: function(store, type, id) {
        this._request("find", [type, id], function(value) {
            store.load(type, value);
        });
    },

    findAll: function(store, type) {
        this._request("search", [type], function(value) {
            store.loadMany(type, value);
        });
    },

    findQuery: function(store, type, query, modelArray) {
        this._request("search", [type, query], function(value) {
            modelArray.load(value);
        });
    }
});