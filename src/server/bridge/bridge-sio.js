var config = require("../config").config,
    model = require("../model"),
    io = require("socket.io"),
    parseCookie = require("connect").utils.parseCookie,
    Session = require('connect').middleware.session.Session;

//TODO: authentication
//authorizers do not check if the username or password is in the object - this must be done separately!

exports.use = function(expressApp, backend, authorizer) {
    var sio = io.listen(expressApp, {log: false});

    sio.sockets.on("connection", function(socket) {
        socket.user = authorizer.unauthenticated();
        socket.expressApp = expressApp;
        socket.backend = backend;
        socket.authorizer = authorizer;

        socket.reply = function(obj, callback) { if(typeof(callback) == 'function') callback(obj); }

        if(config.debug) {
            socket._reply = socket.reply;

            socket.reply = function(obj, callback) {
                console.log("Replying to " + socket.id + ":", obj);
                socket._reply(obj, callback);
            }
        }

        socket.on("auth", auth);
        socket.on("produce", produce);
        socket.on("consume", consume);

        if(config.debug) {
            var debugLogger = function(header) {
                return function(req) {
                    console.log("Request:", header, req);
                };
            };

            socket.on("auth", debugLogger("auth"));
            socket.on("produce", debugLogger("produce"));
            socket.on("consume", debugLogger("consume"));
        }
    });
};

function auth(req, callback) {
    var self = this;
    var error = model.validateAuthRequest(req);

    if(error) {
        self.reply(model.emptyResponse(error), callback);
    } else {
        self.authorizer.authenticate(req.username, req.password, function(error, user) {
            if(error) {
                self.reply(model.emptyResponse(error), callback);
            } else {
                self.user = user;
                self.reply(model.emptyResponse(), callback);
            }
        });
    }
}

function produce(req, callback) {
    var self = this;
    var error = model.validateProduceRequest(req);

    if(error) {
        self.reply(model.emptyResponse(error), callback);
    } else {
        self.backend.produce(self.user, req, function(res) {
            self.reply(res, callback);
        });
    }
}

function consume(req, callback) {
    var self = this;
    var error = model.validateConsumeRequest(req);

    if(error) {
        self.reply(model.consumeResponse(error), callback);
    } else {
        if(req.isComplex) {
            try {
                req.key = new RegExp(req.key);
            } catch(e) {
                return self.reply(model.consumeResponse("Could not compile key"), callback);
            }
        }

        self.backend.consume(self.user, req, function(res) {
            self.reply(res, callback);
        });
    }
}