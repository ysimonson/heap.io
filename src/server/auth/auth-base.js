function Authorizer(config) {
    this.config = config;
}

Authorizer.prototype.authenticate = function(username, password, callback) {
    callback(null, new SpecialUser(true));
};

Authorizer.prototype.root = function() {
    return new SpecialUser(true);
};

Authorizer.prototype.unauthenticated = function() {
    return new SpecialUser(false);
};

function SpecialUser(can) {
    this.can = can;
};

SpecialUser.prototype.canProduce = function() {
    return this.can;
}

SpecialUser.prototype.canConsume = function() {
    return this.can;
}

exports.Authorizer = Authorizer;
