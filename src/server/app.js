var express = require("express"),
    backend = require("./backend"),
    config = require("./config").config,
    auth = require("./auth/auth-" + config.auth.type);

var app = express.createServer(),
    datastore = new backend.Datastore(),
    authorizer = new auth.Authorizer(config.auth);

for(var i=0; i<config.bridges.length; i++) {
    var bridge = require("./bridge/bridge-" + config.bridges[i]);
    bridge.use(app, datastore, authorizer);
}

app.listen(config.port);