__model_scope__ = (function() {
    var MAX_KEY_LENGTH = 4096,
        MAX_VALUE_LENGTH = 4 * 1024 * 1024,
        MIN_USERNAME_LENGTH = 1,
        MAX_USERNAME_LENGTH = 100,
        MIN_PASSWORD_LENGTH = 0,
        MAX_PASSWORD_LENGTH = 100;

    var validate = function(obj /*, validators... */) {
        var error = null;

        for(var i=1; i<arguments.length; i++) {
            error = arguments[i](obj);
            if(error) return error;
        }
    }

    var simpleType = function(name, expectedType) {
        return function(obj) {
            var value = obj[name];

            if(value === undefined) {
                return "No " + name + " specified";
            } else if(typeof(obj[name]) != expectedType) {
                return name + " is not a valid " + expectedType;
            }
        };
    };

    var stringType = function(name, minLength, maxLength) {
        var typeChecker = simpleType(name, 'string', false);

        return function(obj) {
            var typeCheckingResult = typeChecker(obj);

            if(typeCheckingResult) {
                return typeCheckingResult;
            } else if(minLength !== undefined && obj[name].length < minLength) {
                return name + " must be at least " + minLength + " characters long";
            } else if(maxLength !== undefined && obj[name].length > maxLength) {
                return name + " cannot be greater than " + maxLength + " characters long";
            }
        };
    };

    var valueValidator = function(obj) {
        try {
            var valueSerialized = JSON.stringify(obj.value);
            if(valueSerialized.length > MAX_VALUE_LENGTH) return "value cannot be greater than " + MAX_VALUE_LENGTH + " characters long";
        } catch(e) {
            return "value cannot be serialized to JSON";
        }
    };

    var keyValidator = stringType("key", 1, MAX_KEY_LENGTH);
    var isComplexValidator = simpleType("isComplex", "boolean");
    var timeoutValidator = simpleType("timeout", "number");
    var usernameValidator = stringType("username", MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH);
    var passwordValidator = stringType("password", MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH);

    return {
        authRequest: function(username, password) {
            return {username: username, password: password}
        },

        produceRequest: function(key, value) {
            return {key: key, value: value};
        },

        emptyResponse: function(error) {
            return {error: error};
        },

        consumeRequest: function(key, timeout) {
            var isComplex = false;
            var serializedKey = key;

            if(key instanceof RegExp) {
                isComplex = true;
                serializedKey = key.toString();
                serializedKey = serializedKey.substring(1, serializedKey.length - 1);
            }

            return {key: serializedKey, isComplex: isComplex, timeout: timeout};
        },

        consumeResponse: function(error, key, value) {
            return {error: error, key: key, value: value};
        },

        validateAuthRequest: function(obj) {
            return validate(obj, usernameValidator, passwordValidator);
        },

        validateProduceRequest: function(obj) {
            return validate(obj, keyValidator, valueValidator);
        },

        validateConsumeRequest: function(obj) {
            return validate(obj, keyValidator, isComplexValidator, timeoutValidator);
        }
    };
})();