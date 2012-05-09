var model = require("../../model");

exports.use = function(expressApp, backend, authorizer, pluginConfig) {
    var checkAuth = function(req, res, next) {
        var header = req.headers['authorization'] || '',
            token = header.split(/\s+/).pop() || '',
            auth = new Buffer(token, 'base64').toString(),
            parts = auth.split(":");

        if(parts.length < 2) {
            res.send(model.emptyResponse("Credentials required"), 401);
        } else {
            var username = parts[0], password = parts[1];

            authorizer.authenticate(username, password, function(error, user) {
                if(error) {
                    res.send(model.emptyResponse("Bad username/password"), 401);
                } else {
                    req.user = user;
                    next();
                }
            });
        }
    };

    var validateObj = function(validator) {
        return function(req, res, next) {
            if(typeof(req.body) != 'object') {
                res.send(model.emptyResponse("Request is not valid JSON"), 400);
            } else {
                var error = validator(req.body);

                if(error) {
                    res.send(model.emptyResponse(error), 400);
                } else {
                    next();
                }
            }
        };
    };

    var allowOrigin = function(req, res, next) {
        res.header("Access-Control-Allow-Origin", pluginConfig.origin);
        res.header("Access-Control-Allow-Headers", "Authorization,Content-Type");
        next();
    };

    expressApp.all("/produce", allowOrigin);
    expressApp.all("/consume", allowOrigin);
    expressApp.all("/consume/confirm", allowOrigin);

    expressApp.post("/produce", checkAuth, validateObj(model.validateProduceRequest), function(req, res) {
        backend.produce(req.user, req.body, function(obj) {
            res.send(obj, obj.error ? 400 : 200);
        });
    });

    expressApp.post("/consume", checkAuth, validateObj(model.validateConsumeRequest), function(req, res) {
        if(req.body.isComplex) {
            try {
                req.body.key = new RegExp(req.body.key);
            } catch(e) {
                return res.send(model.consumeResponse("Could not compile key"), 400);
            }
        }
    
        backend.consume(req.user, req.body, function(obj) {
            res.send(obj, obj.error ? 400 : 200);
        });
    });

    expressApp.post("/consume/confirm", checkAuth, validateObj(model.validateConfirmConsumeRequest), function(req, res) {
        backend.confirmConsume(req.user, req.body, function(obj) {
            res.send(obj, obj.error ? 400 : 200);
        });
    });
};
