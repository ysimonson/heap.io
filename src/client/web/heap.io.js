(function() {
    __model_source__
    __patterns_source__

    function defaultHost() {
        var host = window.location.protocol + "//" + window.location.hostname;
        if(window.location.port) host += ":" + window.location.port;
        return host;
    }

    function HeapIO() {
        var self = this;

        self.host = arguments.length > 1 ? arguments[0] : defaultHost();
        self.username = arguments.length > 2 ? arguments[1] : null;
        self.password = arguments.length > 3 ? arguments[2] : "";

        var callback = arguments.length > 0 ? arguments[arguments.length - 1] : function(error) {
            if(error) throw new Error(error);  
        };

        if(self.host.indexOf("http://") != 0 && self.host.indexOf("https://") != 0) {
            self.host = "http://" + self.host;
        }

        self._socket = io.connect(self.host);

        self._socket.on('error', function(message) {
            console.error(message);
        });

        self._socket.on('connect', function() {
            if(self.username) {
                self.authenticate(self.username, self.password, callback);
            } else {
                callback();
            }
        });
    }

    HeapIO.prototype._request = function(modelCreator, validator, args, header, callback) {
        var req = model[modelCreator].apply(model, args);
        var error = model[validator](req);

        if(error) {
            throw new Error(error);
        } else {
            this._socket.emit(header, req, callback);
        }
    };

    HeapIO.prototype.authenticate = function(username, password, callback) {
        this._request('authRequest', 'validateAuthRequest', [username, password], 'auth', function(res) {
            if(callback) callback(res.error);
        });
    };

    HeapIO.prototype.produce = function(key, value, callback) {
        this._request('produceRequest', 'validateProduceRequest', [key, value], 'produce', function(res) {
            if(callback) callback(res.error);
        });
    };

    HeapIO.prototype.consume = function(key, timeout, callback) {
        this._request('consumeRequest', 'validateConsumeRequest', [key, timeout], 'consume', function(res) {
            if(callback) callback(res.error, res.key, res.value);
        });
    };

    this.HeapIO = HeapIO;
    this.HeapIOPatterns = HeapIOPatterns;
})(this);