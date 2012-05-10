var store = {};
var id = 1;

function getContainer(name) {
    var container = store[name];
    if(container == undefined) store[name] = container = {};
    return container;
}

function values(obj) {
    var a = [];
    for(var key in obj) a.push(obj[key]);
    return a;
}

module.exports = {
    create: function(request, type, record) {
        console.log("CREATE", type, record);
        record.id = id++;
        getContainer(type)[record.id] = record;
        console.log("=>", record);
        request.finish(record);
    },

    update: function(request, type, record) {
        console.log("UPDATE", type, record);
        getContainer(type)[record.id] = record;
        console.log("=>", record);
        request.finish(record);
    },

    delete: function(request, type, record) {
        console.log("DELETE", type, record);
        delete getContainer(type)[record.id];
        request.finish({});
    },

    search: function(request, type, query) {
        console.log("SEARCH", type, query);

        var searchResults = values(getContainer(type));

        if(query) {
            var filteredValues = [];

            for(var i=0; i<searchResults.length; i++) {
                var candidate = searchResults[i], keep = true;

                for(var key in query) {
                    if(candidate[key] != query[key]) {
                        keep = false;
                        break;
                    }
                }

                if(keep) filteredValues.push(candidate);
            }

            searchResults = filteredValues;
        }

        console.log("=>", searchResults);
        request.finish(searchResults);
    }
};