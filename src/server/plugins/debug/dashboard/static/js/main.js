var MAX_ENTRIES = 500;
var UPDATE_FREQUENCY = 3000;

var BADGE_TYPES = {
    produce: "badge-success",
    consume: "badge-info",
    snapshot: "badge-warning"
};

var eventTemplate = null, eventContentTemplate = null;

function hasKeys(obj) {
    for(var key in obj) return true;
    return false;
}

function flattenObj(obj) {
    var newObj = {};

    for(var key in obj) {
        newObj[key] = JSON.stringify(obj[key]);
    }

    return newObj;
}

function flattenArray(array) {
    var newArray = [];

    for(var i=0; i<array.length; i++) {
        newArray.push(JSON.stringify(array[i]));
    }

    return newArray;
};

function addEntry(entry) {
    var container = $("#content");

    if(container.children().size() >= MAX_ENTRIES) {
        $(container[container.length - 1]).remove();
    }

    container.prepend($(eventTemplate(entry)));
}

function updateEntry(entry) {
    $("#" + entry.id).replaceWith($(eventTemplate(entry)));
}

function createEntry(obj) {
    var action = /consume/.test(obj.name) ? "consume" : "produce";
    var entries = {};

    console.log(obj.req.key);

    return {
        id: "event-" + obj.eventId,
        name: obj.req.key,
        badgeType: BADGE_TYPES[action],
        type: action,

        entries: {
            user: obj.user,
            req: flattenObj(obj.req),
            res: flattenObj(obj.res)
        }
    };
}

function newSnapshot(obj) {
    var time = new Date();

    var flattenInnerArrays = function(obj) {
        var values = {};
        for(var key in obj) values[key] = flattenArray(obj[key]);
        return values;
    };

    addEntry({
        id: "snapshot",
        name: "Snapshot at " + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds(),
        badgeType: BADGE_TYPES.snapshot,
        type: "snapshot",

        entries: {
            values: flattenInnerArrays(obj.values),
            "simple waiters": flattenInnerArrays(obj.simpleWaiters),
            "complex waiters": flattenArray(obj.complexWaiters)
        }
    });
}

function getSnapshot() {
    $.getJSON("/dashboard/snapshot", newSnapshot);
}

function startUpdates() {
    var since = 0;

    var getUpdate = function() {
        //TODO: since is bad because there's a pre and post
        var payload = since ? {since: since} : {};

        $.getJSON("/dashboard/update", payload, function(updates) {
            if(updates.length > 0) {
                since = updates[updates.length - 1].traceId;
            }

            for(var i=0; i<updates.length; i++) {
                var update = updates[i];
                var entry = createEntry(update);
                var callback = /post/.test(update.name) ? updateEntry : addEntry;
                callback(entry);
            }

            setTimeout(getUpdate, UPDATE_FREQUENCY);
        });
    }

    getUpdate();
}

$(function() {
    eventTemplate = tmpl($("#event-view").html());
    eventContentTemplate = tmpl($("#event-content-view").html());

    $("#search-form").submit(function(e) {
        return false;
    });

    $("#get-snapshot").click(function(e) {
        e.preventDefault();
        getSnapshot();
    });

    startUpdates();
});