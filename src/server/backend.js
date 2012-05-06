//TODO: need a way of detecting dropped events and re-enqueing them

var model = require("./model"),
    str = require("./str"),
    dsutil = require("./dsutil");

function Datastore() {
    this._values = {};
    this._simpleWaiters = {};
    this._complexWaiters = [];
    this._tieBreaker = true;
};

Datastore.prototype.produce = function(user, req, callback) {
    var self = this;

    var runWaiter = function(waiter) {
        if(waiter) {
            if(waiter.timeout != null) clearTimeout(waiter.timeout);
            waiter.callback(model.consumeResponse(null, req.key, req.value));
            return true;
        } else {
            return false;
        }
    }

    var trySimpleWaiters = function() {
        return runWaiter(dsutil.dequeueFromMap(self._simpleWaiters, req.key));
    };

    var tryComplexWaiters = function() {
        return runWaiter(dsutil.removeByPredicate(self._complexWaiters, function(complexWaiter) {
            return complexWaiter.user.canConsume(req.key) && str.fullMatch(complexWaiter.key, req.key);
        }));
    };

    var tryDatastore = function() {
        dsutil.enqueueToMap(self._values, req.key, req.value);
    };

    if(!user.canProduce(req.key)) {
        return callback(model.emptyResponse("Unauthorized"))
    }

    self._tieBreaker = !self._tieBreaker;

    if(self._tieBreaker) {
        trySimpleWaiters() || tryComplexWaiters() || tryDatastore();
    } else {
        tryComplexWaiters() || trySimpleWaiters() || tryDatastore();
    }

    callback(model.emptyResponse());
};

Datastore.prototype.consume = function(user, req, callback) {
    var self = this;

    var createWaiter = function(timeoutCallback) {
        var timeoutId = null;

        if(req.timeout > 0) {
            timeoutId = setTimeout(function() {
                callback(model.consumeResponse(null, null, null));
                timeoutCallback(timeoutId);
            }, req.timeout);
        }

        return {user: user, key: req.key, timeout: timeoutId, callback: callback};
    };

    var consumeSimple = function() {
        if(!user.canConsume(req.key)) {
            return callback(model.consumeResponse("Unauthorized", null, null));
        }

        var value = dsutil.dequeueFromMap(self._values, req.key);

        if(value !== undefined) {
            callback(model.consumeResponse(null, req.key, value));
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
                callback(model.consumeResponse(null, key, dsutil.dequeueFromMap(self._values, key)));
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
    
};

exports.Datastore = Datastore;