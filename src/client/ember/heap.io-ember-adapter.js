require("ember-data/core");
require("ember-data/system/adapters");

DS.HeapIOAdapter = DS.Adapter.extend({
    constructor: function(heap) {
        this.heap = heap;
    }

    createRecord: function(store, type, record) {
        //
    },

    updateRecord: function(store, type, record) {
        //
    },

    deleteRecord: function(store, type, record) {
        //
    },

    find: function(store, type, id) {
        //
    },

    findAll: function(store, type) {
        //
    },

    findQuery: function(store, type, query, recordArray) {
        //
    }
});