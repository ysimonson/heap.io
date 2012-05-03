var store = {};
var id = 0;

function getContainer(name) {
    var container = store[name];
    if(container == undefined) container[name] = container = {};
    return container;
}

function values(obj) {
    var a = [];
    for(var key in obj) a.push(obj[key]);
    return a;
}

module.exports = {
    create: function(request, type, record) {
        console.log("ASDASDASDASDASDASDASDSAD", request, type, record);
        record.id = id++;
        getContainer(type)[record.id] = record;
        request.finish(record);
    },

    update: function(request, type, record) {
        getContainer(type)[record.id] = record;
        request.finish(record);
    },

    delete: function(request, type, record) {
        delete getContainer(type)[record.id];
        request.finish(record);
    },

    find: function(request, type, id) {
        if(id === null) {
            request.finish(values(getContainer(type)));
        } else {
            request.finish(getContainer(type)[id]);
        }
    },

    search: function(type, query) {
        //TODO
        console.log(query);
        request.finish(values(getContainer(type)));
    }
};