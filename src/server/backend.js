//TODO: need a way of detecting dropped events and re-enqueing them

var model = require("./model"),
    str = require("./str"),
    dsutil = require("./dsutil"),
    util = require("util"),
    events = require("events");

function Datastore() {
    events.EventEmitter.call(this);
    this._values = {};
    this._simpleWaiters = {};
    this._complexWaiters = [];
    this._tieBreaker = true;
};

util.inherits(Datastore, events.EventEmitter);

Datastore.prototype._respond = function(event, callback, user, req, res) {
    callback(res);
    this.emit(event, {user: user, req: req, res: res});
};

Datastore.prototype.produce = function(user, req, callback) {
    var self = this;
    self.emit("produce/pre", {user: user, req: req});

    var runWaiter = function(waiter) {
        if(waiter) {
            if(waiter.timeout != null) clearTimeout(waiter.timeout);
            var res = model.consumeResponse(null, req.key, req.value);
            self._respond("consume/post", waiter.callback, waiter.user, waiter.req, res);
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
        return self._respond("produce/post", callback, user, req, res);
    }

    self._tieBreaker = !self._tieBreaker;

    if(self._tieBreaker) {
        trySimpleWaiters() || tryComplexWaiters() || tryDatastore();
    } else {
        tryComplexWaiters() || trySimpleWaiters() || tryDatastore();
    }

    self._respond("produce/post", callback, user, req, model.emptyResponse());
};

Datastore.prototype.consume = function(user, req, callback) {
    var self = this;
    self.emit("consume/pre", {user: user, req: req});

    var createWaiter = function(timeoutCallback) {
        var timeoutId = null;

        if(req.timeout > 0) {
            timeoutId = setTimeout(function() {
                var res = model.consumeResponse(null, null, null);
                self._respond("consume/post", callback, user, req, res);
                timeoutCallback(timeoutId);
            }, req.timeout);
        }

        return {user: user, req: req, timeout: timeoutId, callback: callback};
    };

    var consumeSimple = function() {
        if(!user.canConsume(req.key)) {
            var res = model.consumeResponse("Unauthorized", null, null);
            self._respond("consume/post", callback, user, req, res);
            return;
        }

        var value = dsutil.dequeueFromMap(self._values, req.key);

        if(value !== undefined) {
            var res = model.consumeResponse(null, req.key, value);
            self._respond("consume/post", callback, user, req, res);
        } else {
            var container = dsutil.getOrCreateContainer(self._simpleWaiters, req.key);

            container.unshift(createWaiter(function(timeoutId) {
                dsutil.removeFromMapByPredicate(self._simpleWaiters, req.key, function(simpleWaiter) {
                    return simpleWaiter.timeout == timeoutId;
                });
            }));
        }
    };

    var consumeComplexForExisting = function() {
        for(var key in self._values) {
            if(user.canConsume(key) && str.fullMatch(req.key, key)) {
                var res = model.consumeResponse(null, key, dsutil.dequeueFromMap(self._values, key));
                self._respond("consume/post", callback, user, req, res);
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

exports.Datastore = Datastore;