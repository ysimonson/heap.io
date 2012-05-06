(function() {
    __model_source__
    __patterns_source__
    __b64_source__

    function defaultHost() {
        var host = window.location.protocol + "//" + window.location.hostname;
        if(window.location.port) host += ":" + window.location.port;
        return host;
    }

    function WebSocketEngine(host, auth, callback) {
        var self = this;
        host = host.indexOf("https://") == 0 ? "wss://" + host.substring(8) : "ws://" + host.substring(7);
        self.ws = new WebSocket(host);
        self.requestId = 0;
        self.pendingRequests = {};

        self.ws.onerror = function(event) {
            self.onError(event.data);
        };

        self.ws.onmessage = function(event) {
            var json = JSON.parse(event.data);
            var callback = self.pendingRequests[json.id];

            if(callback) {
                delete self.pendingRequests[json.id];
                callback(json.payload);
            } else {
                throw new Error("No callback found associated with request ID " + json.id);
            }
        };

        self.ws.onopen = function() {
            if(auth) {
                self.call("auth", auth, function(res) {
                    callback(res.error);
                });
            } else {
                callback();
            }
        };
    }

    WebSocketEngine.prototype.call = function(request, payload, callback) {
        var curRequestId = this.requestId++;
        this.pendingRequests[curRequestId] = callback;
        this.ws.send(JSON.stringify({id: curRequestId, request: request, payload: payload}));
    };

    function PollingEngine(host, auth, callback) {
        this.host = host;
        this.auth = auth;
        callback();
    }

    PollingEngine.prototype.call = function(request, payload, callback) {
        var xhr = this.getXHR();
        xhr.open("POST", this.host + request, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        if(this.auth) {
            var encodedAuth = Base64.encode(this.auth.username + ":" + this.auth.password);
            xhr.setRequestHeader("Authorization", "Basic " + encodedAuth);
        }

        xhr.send(JSON.stringify(payload));

        xhr.onreadystatechange = function() {
            if(xhr.readyState == 4) {
                callback(JSON.parse(xhr.responseText));
            }
        };
    };

    PollingEngine.prototype.getXHR = function() {
        if(window.XMLHttpRequest) return new XMLHttpRequest();

        try {
            return new ActiveXObject("Msxml2.XMLHTTP.6.0");
        } catch(e) {
            try {
                return new ActiveXObject("Msxml2.XMLHTTP.3.0");
            } catch(e) {
                try {
                    return new ActiveXObject("Microsoft.XMLHTTP");
                } catch(e) {
                    throw new Error("This browser does not support heap.io");
                }
            }
        }
    };

    function IO() {
        var self = this;
        self.host = arguments.length > 1 ? arguments[0] : defaultHost();
        self.username = arguments.length > 2 ? arguments[1] : null;
        self.password = arguments.length > 3 ? arguments[2] : "";
        var auth = null;

        var callback = arguments.length > 0 ? arguments[arguments.length - 1] : function(error) {
            if(error) throw new Error(error);  
        };

        if(self.host.indexOf("http://") != 0 && self.host.indexOf("https://") != 0) {
            self.host = window.location.protocol + "//" + self.host;
        }

        if(self.host.charAt(self.host.length - 1) != "/") {
            self.host = self.host + "/";
        }

        if(self.username) {
            auth = model.authRequest(self.username, self.password);
            var authValidationError = model.validateAuthRequest(auth);
            if(authValidationError) throw new Error(authValidationError);
        }        

        var Backend = window.WebSocket !== undefined ? WebSocketEngine : PollingEngine;
        self._backend = new Backend(self.host, auth, callback);

        self._backend.onError = function() {
            console.error(message);
        };
    }

    IO.prototype.produce = function(key, value, callback) {
        var payload = model.produceRequest(key, value);
        var error = model.validateProduceRequest(payload);

        if(error) {
            throw new Error(error);
        } else {
            this._backend.call("produce", payload, function(res) {
                if(callback) callback(res.error);
            });
        }
    };

    IO.prototype.consume = function(key, timeout, callback) {
        var payload = model.consumeRequest(key, timeout);
        var error = model.validateConsumeRequest(payload);

        if(error) {
            throw new Error(error);
        } else {
            this._backend.call("consume", payload, function(res) {
                if(callback) callback(res.error, res.key, res.value);
            });
        }
    };

    this.heap = {
        IO: IO,
        loop: patterns.loop,
        rpcClient: patterns.rpcClient,
        rpcServer: patterns.rpcServer
    };
})(this);