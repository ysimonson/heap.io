var express = require("express");

exports.use = function(expressApp, backend, authorizer, pluginConfig) {
    expressApp.use(express.static(__dirname + "/static"));
};
