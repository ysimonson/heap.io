var express = require("express"),
    backend = require("./backend"),
    config = require("./config").config,
    auth = require("./auth/auth-" + config.auth.type);

var app = express.createServer(),
    datastore = new backend.Datastore(),
    authorizer = new auth.Authorizer(config.auth);

app.use(express.bodyParser());

for(var pluginName in config.plugins) {
    var plugin = require("./plugins/" + pluginName);
    plugin.use(app, datastore, authorizer, config.plugins[pluginName]);
}

app.listen(config.port);