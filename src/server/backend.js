var queue = require("./queue"),
    model = require("./model"),
    str = require("./str");

function Datastore() {
    this._values = new queue.QueueMap();        //{string => ...}
    this._simpleWaiters = new queue.QueueMap(); //{key => {key: string, callback: function(key, value), timeout: number}}
    this._complexWaiters = new queue.Queue();   //[{key: regex, callback: function(key, value), timeout: number}]
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
        return runWaiter(self._simpleWaiters.dequeue(req.key));
    };

    var tryComplexWaiters = function() {
        return runWaiter(self._complexWaiters.removeByPredicate(function(complexWaiter) {
            return complexWaiter.user.canConsume(req.key) && str.fullMatch(complexWaiter.key, req.key);
        }));
    };

    var tryDatastore = function() {
        self._values.enqueue(req.key, req.value);
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

        var value = self._values.dequeue(req.key);

        if(value !== undefined) {
            callback(model.consumeResponse(null, req.key, value));
        } else {
            self._simpleWaiters.enqueue(req.key, createWaiter(function(timeoutId) {
                self._simpleWaiters.map[req.key].removeByPredicate(function(simpleWaiter) {
                    return simpleWaiter.timeout == timeoutId;
                });
            }));
        }
    };

    var consumeComplexForExisting = function() {
        for(var key in self._values.map) {
            if(user.canConsume(key) && str.fullMatch(req.key, key)) {
                callback(model.consumeResponse(null, key, self._values.dequeue(key)));
                return true;
            }
        }
    };

    var enqueueComplexWaiter = function() {
        self._complexWaiters.enqueue(createWaiter(function(timeoutId) {
            self._complexWaiters.removeByPredicate(function(complexWaiter) {
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

exports.Datastore = Datastore;