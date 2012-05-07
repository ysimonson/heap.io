var express = require("express"),
    _ = require("underscore");

var MAX_EVENTS = 1000, EVENTS_GC_TIME = 1000;
var events = [];

setInterval(function() {
    if(events.length > MAX_EVENTS) {
        events = events.slice(-MAX_EVENTS);
    }
}, EVENTS_GC_TIME);

exports.use = function(expressApp, backend, authorizer, pluginConfig) {
    expressApp.use(express.static(__dirname + "/static"));

    addEventListener(backend, "produce/pre");
    addEventListener(backend, "produce/post");
    addEventListener(backend, "consume/pre");
    addEventListener(backend, "consume/post");

    expressApp.get("/dashboard/snapshot", function(req, res) {
        res.send(getSnapshot(backend), 200);
    });

    expressApp.get("/dashboard/update", function(req, res) {
        var since = req.query.since || null;
        res.send(getEvents(since), 200);
    });
};

function addEventListener(backend, event) {
    backend.on(event, function(obj) {
        var req = _.clone(obj.req);

        //Fix for regex pattern keys on consume
        if(req.isComplex) {
            req.key = req.key.toString();
        }

        events.push({
            name: event,
            eventId: obj.eventId,
            traceId: obj.traceId,
            user: obj.user.username,
            req: req,
            res: obj.res
        });
    });
}

function getEvents(since) {
    var found = false

    if(since !== null) {
        var low = 0, high = events.length - 1;
        var i, comparison;

        while(low <= high) {
            i = Math.floor((low + high) / 2);
            comparison = events[i].traceId - since;

            if(comparison < 0) {
                low = i + 1;
            } else if(comparison > 0) {
                high = i - 1;
            } else {
                found = true;
                break;
            }
        }
    }

    return found ? events.slice(i + 1) : events;
}

function getSnapshot(backend) {
    var cleanWaiter = function(waiter) {
        return {user: waiter.user.username, req: waiter.req};
    };

    var simpleWaiters = {};

    for(var key in backend._simpleWaiters) {
        simpleWaiters[key] = _.map(backend._simpleWaiters[key], cleanWaiter);
    }

    var complexWaiters = _.map(backend._complexWaiters, cleanWaiter);

    return {
        values: backend._values,
        simpleWaiters: simpleWaiters,
        complexWaiters: complexWaiters
    }
}