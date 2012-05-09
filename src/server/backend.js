//TODO: need a way of detecting dropped events and re-enqueing them

var model = require("./model"),
    str = require("./str"),
    dsutil = require("./dsutil"),
    util = require("util"),
    events = require("events"),
    config = require("./config").config;

var eventIdCounter = 1, traceIdCounter = 1;

function Datastore() {
    events.EventEmitter.call(this);
    this._values = {};
    this._simpleWaiters = {};
    this._complexWaiters = [];
    this._tieBreaker = true;
    this._unconfirmedConsumes = {};
};

util.inherits(Datastore, events.EventEmitter);

Datastore.prototype._emit = function(event, eventId, user, req, res) {
    this.emit(event, {
        traceId: traceIdCounter++,
        eventId: eventId,
        user: user,
        req: req,
        res: res
    });
};

Datastore.prototype._respond = function(event, callback, eventId, user, req, res) {
    callback(res);
    this._emit(event, eventId, user, req, res);
};

Datastore.prototype._consumeResponse = function(callback, eventId, user, req, error, key, value) {
    var self = this;
    var res = model.consumeResponse(error, eventId, key, value);
    self._respond("consume/post", callback, eventId, user, req, res);

    if(!error) {
        var timeoutId = setTimeout(function() {
            delete self._unconfirmedConsumes[eventId];
            dsutil.getOrCreateContainer(self._values, key).push(value);
        }, config.eventProcessTimeout);

        self._unconfirmedConsumes[eventId] = { timeout: timeoutId, user: user };
    }
};

Datastore.prototype.produce = function(user, req, callback) {
    var self = this;
    var eventId = eventIdCounter++;
    self._emit("produce/pre", eventId, user, req, null);

    var runWaiter = function(waiter) {
        if(waiter) {
            if(waiter.timeout != null) clearTimeout(waiter.timeout);
            self._consumeResponse(waiter.callback, waiter.eventId, waiter.user, waiter.req, null, req.key, req.value);
            return true;
        } else {
            return false;
        }
    };

    var trySimpleWaiters = function() {
        return runWaiter(dsutil.dequeueFromMap(self._simpleWaiters, req.key));
    };

    var tryComplexWaiters = function() {
        return runWaiter(dsutil.removeByPredicate(self._complexWaiters, function(complexWaiter) {
            return complexWaiter.user.canConsume(req.key) && str.fullMatch(complexWaiter.req.key, req.key);
        }));
    };

    var tryDatastore = function() {
        dsutil.enqueueToMap(self._values, req.key, req.value);
    };

    if(!user.canProduce(req.key)) {
        var res = model.emptyResponse("Unauthorized");
        return self._respond("produce/post", callback, eventId, user, req, res);
    }

    self._tieBreaker = !self._tieBreaker;

    if(self._tieBreaker) {
        trySimpleWaiters() || tryComplexWaiters() || tryDatastore();
    } else {
        tryComplexWaiters() || trySimpleWaiters() || tryDatastore();
    }

    self._respond("produce/post", callback, eventId, user, req, model.emptyResponse());
};

Datastore.prototype.consume = function(user, req, callback) {
    var self = this;
    var eventId = eventIdCounter++;
    self._emit("consume/pre", eventId, user, req, null);

    var createWaiter = function(timeoutCallback) {
        var timeoutId = null;

        if(req.timeout > 0) {
            timeoutId = setTimeout(function() {
                self._consumeResponse(callback, eventId, user, req, null, null, null);
                timeoutCallback(timeoutId);
            }, req.timeout);
        }

        return {
            eventId: eventId,
            user: user,
            req: req,
            timeout: timeoutId,
            callback: callback
        };
    };

    var consumeSimple = function() {
        if(!user.canConsume(req.key)) {
            return self._consumeResponse(callback, eventId, user, req, "Unauthorized", null, null);
        }

        var value = dsutil.dequeueFromMap(self._values, req.key);

        if(value !== undefined) {
            return self._consumeResponse(callback, eventId, user, req, null, req.key, value);
        }
 
        var container = dsutil.getOrCreateContainer(self._simpleWaiters, req.key);

        container.unshift(createWaiter(function(timeoutId) {
            dsutil.removeFromMapByPredicate(self._simpleWaiters, req.key, function(simpleWaiter) {
                return simpleWaiter.timeout == timeoutId;
            });
        }));
    };

    var consumeComplexForExisting = function() {
        for(var key in self._values) {
            if(user.canConsume(key) && str.fullMatch(req.key, key)) {
                var value = dsutil.dequeueFromMap(self._values, key);
                self._consumeResponse(callback, eventId, user, req, null, key, value);
                return true;
            }
        }
    };

    var enqueueComplexWaiter = function() {
        //Added to the end (rather than the beginning like everywhere else) to
        //make complex waiters in ascending order of insertion time. This way
        //earlier complex waiters are matched first, preventing starvation.
        self._complexWaiters.push(createWaiter(function(timeoutId) {
            dsutil.removeByPredicate(self._complexWaiters, function(complexWaiter) {
                return complexWaiter.timeout == timeoutId;
            });
        }));
    };

    if(typeof(req.key) == 'string') {
        consumeSimple();
    } else {
        consumeComplexForExisting() || enqueueComplexWaiter();
    }
};

Datastore.prototype.removeUser = function(user) {
    var remover = function(waiter) { return waiter.user === user; };

    for(var key in this._simpleWaiters) {
        dsutil.removeAllFromMapByPredicate(this._simpleWaiters, key, remover);
    }

    dsutil.removeAllByPredicate(this._complexWaiters, remover);
};

Datastore.prototype.confirmConsume = function(user, req, callback) {
    var unconfirmedConsume = this._unconfirmedConsumes[req.eventId];

    if(!unconfirmedConsume) {
        return callback(model.emptyResponse("Event not found"));
    } else if(unconfirmedConsume.user.username != user.username) {
        return callback(model.emptyResponse("Unauthorized"));
    }

    clearTimeout(unconfirmedConsume.timeoutId);
    delete this._unconfirmedConsumes[req.eventId];
    callback(model.emptyResponse());
};

exports.Datastore = Datastore;