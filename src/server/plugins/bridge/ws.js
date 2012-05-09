var WebSocketServer = require("ws").Server,
    model = require("../../model");

var clientIdCounter = 0;

exports.use = function(expressApp, backend, authorizer, pluginConfig) {
    var wss = new WebSocketServer({server: expressApp});

    wss.on("connection", function(ws) {
        ws.id = "ws/" + (clientIdCounter++);
        ws.expressApp = expressApp;
        ws.backend = backend;
        ws.authorizer = authorizer;

        ws.reply = function(id, payload) {
            if(ws.readyState == 1) {
                ws.send(JSON.stringify({id: id, payload: payload}));
            }
        };

        ws.on("message", function(message) {
            var json = null;

            try {
                json = JSON.parse(message);
            } catch(e) {
                //TODO: log message instead
                console.error("Could not parse request JSON");
            }

            var id = json.id, request = json.request, payload = json.payload;

            if(typeof(json) != 'object') {
                ws.reply(id, model.emptyResponse("Request JSON is not an object"));
            } else if(request == "auth") {
                auth(ws, id, payload);
            } else if(request == "produce") {
                produce(ws, id, payload);
            } else if(request == "consume") {
                consume(ws, id, payload);
            } else if(request == "consume/confirm") {
                confirmConsume(ws, id, payload);
            } else {
                ws.reply(id, model.emptyResponse("Unknown request type"));
            }
        });

        ws.on("close", function() {
            if(ws.user) backend.removeUser(ws.user);
        });
    });
};

function preValidate(validator, callback) {
    return function(socket, id, req) {
        var error = validator(req);

        if(error) {
            socket.reply(req, model.emptyResponse(error));
        } else {
            callback(socket, id, req);
        }
    };
}

var auth = preValidate(model.validateAuthRequest, function(socket, id, req) {
    socket.authorizer.authenticate(req.username, req.password, function(error, user) {
        if(error) {
            socket.reply(id, model.emptyResponse(error));
        } else {
            socket.user = user;
            socket.reply(id, model.emptyResponse());
        }
    });
});

var produce = preValidate(model.validateProduceRequest, function(socket, id, req) {
    socket.backend.produce(socket.user, req, function(res) {
        socket.reply(id, res);
    });
});

var consume = preValidate(model.validateConsumeRequest, function(socket, id, req) {
    if(req.isComplex) {
        try {
            req.key = new RegExp(req.key);
        } catch(e) {
            return socket.reply(id, model.consumeResponse("Could not compile key"));
        }
    }
    
    socket.backend.consume(socket.user, req, function(res) {
        socket.reply(id, res);
    });
}); 

var confirmConsume = preValidate(model.validateConfirmConsumeRequest, function(socket, id, req) {
    socket.backend.confirmConsume(socket.user, req, function(res) {
        socket.reply(id, res);
    });
});