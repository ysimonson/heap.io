var express = require("express"),
    backend = require("./backend"),
    config = require("./config").config,
    auth = require("./auth/auth-" + config.auth.type);

var app = express.createServer(),
    datastore = new backend.Datastore(),
    authorizer = new auth.Authorizer(config.auth);

app.use(express.bodyParser());

for(var bridgeName in config.bridges) {
    var bridge = require("./bridge/bridge-" + bridgeName);
    bridge.use(app, datastore, authorizer);
}

app.listen(config.port);