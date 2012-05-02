var zmq = require('zmq'),
    util = require("util"),
    events = require("events");

__model_source__
__patterns_source__

var CONNECTION_STRING = "ipc:///tmp/heapio";

function HeapIO() {
    events.EventEmitter.call(this);
    this._sockets = [];
};

util.inherits(HeapIO, events.EventEmitter);

HeapIO.prototype._emitError = function(type, message, callback) {
    var error = {type: type, message: message};

    if(callback) {
        callback(error);
    } else {
        this.emit("error", error);
    }
};

HeapIO.prototype._makeRequest = function(parts, callback) {
    var self = this;
    
    //Try to grab a cached socket
    var socket = self._sockets.pop();
    
    //If there are no cached sockets left, create a new one
    if(socket === undefined) {
        socket = zmq.socket('req');
        
        socket.setMaxListeners(2);
        socket.connect(CONNECTION_STRING);
        
        //Proxy socket errors to this Darmok object
        socket.on("error", function(error) {
            self._emitError("socket", error.toString());

            //TODO: should the socket be restored or not?
            self._sockets.push(socket);
        });
    }
    
    socket.send(parts);

    socket.once("message", function(response) {
        var responseJSON = null;

        try {
            responseJSON = JSON.parse(response.toString());
        } catch(e) {
            responseJSON = {error: "Could not decode response to JSON"};
        }

        callback.call(self, responseJSON);
        self._sockets.push(socket);
    });
};

HeapIO.prototype.produce = function(key, value, callback) {
    var req = model.produceRequest(key, value);
    var error = model.validateProduceRequest(req);

    if(error) {
        throw new Error(error);
    } else {
        this._makeRequest(["produce", JSON.stringify(req)], function(res) {
            if(callback) callback(res.error);
        });
    }
};

HeapIO.prototype.consume = function(key, timeout, callback) {
    var req = model.consumeRequest(key, timeout);
    var error = model.validateConsumeRequest(req);

    if(error) {
        throw new Error(error);
    } else {
        this._makeRequest(["consume", JSON.stringify(req)], function(res) {
            if(callback) callback(res.error, res.key, res.value);
        });
    }
};

exports.HeapIO = HeapIO;
exports.HeapIOPatterns = HeapIO;