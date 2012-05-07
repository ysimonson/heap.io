var zmq = require("zmq"),
    model = require("../../model");

var CONNECTION_STRING = "ipc:///tmp/heapio";

exports.use = function(expressApp, backend, authorizer, pluginConfig) {
    var socket = zmq.socket('xrep');

    socket.expressApp = expressApp;
    socket.backend = backend;
    socket.user = authorizer.root();
    socket.reply = function(envelope, message) { socket.send([envelope, "", JSON.stringify(message)]) };

    socket.bind(CONNECTION_STRING, function(error) {
        if(error) throw error;

        socket.on('message', function(envelope, _, header, content) {
            var contentJSON = null;

            try {
                contentJSON = JSON.parse(content);
            } catch(e) {
                this.reply(envelope, "Could not parse message");
            }

            if(header == "produce") {
                produce.call(socket, envelope, contentJSON);
            } else if(header == "consume") {
                consume.call(socket, envelope, contentJSON);
            }
        });
    });
};

function produce(envelope, req) {
    var self = this;
    var error = model.validateProduceRequest(req);

    if(error) {
        self.reply(envelope, model.emptyResponse(error));
    } else {
        self.backend.produce(self.user, req, function(res) {
            self.reply(envelope, res);
        });
    }
}

function consume(envelope, req) {
    var self = this;
    var error = model.validateConsumeRequest(req);

    if(error) {
        self.reply(envelope, model.consumeResponse(error));
    } else {
        if(req.isComplex) {
            try {
                req.key = new RegExp(req.key);
            } catch(e) {
                return self.reply(envelope, model.consumeResponse("Could not compile key"));
            }
        }

        self.backend.consume(self.user, req, function(res) {
            self.reply(envelope, res);
        });
    }
}