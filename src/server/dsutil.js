var DEFAULT_CONTAINER_SIZE = 512;

function getOrCreateContainer(source, key) {
    var container = source[key];

    if(container === undefined) {
        container = new Array(DEFAULT_CONTAINER_SIZE);
        container.length = 0;
        source[key] = container;
    }

    return container;
}

function enqueueToMap(source, key, value) {
    var container = getOrCreateContainer(source, key);
    return container !== undefined ? container.unshift(value) : undefined;
}

function dequeueFromMap(source, key) {
    var container = source[key];

    if(container) {
        if(container.length == 1) delete source[key];
        return container.pop();
    }
}

function removeByPredicate(container, predicate) {
    for(var i=0; i<container.length; i++) {
        if(predicate(container[i]) === true) {
            return container.splice(i, 1)[0];
        }
    }
}

function removeFromMapByPredicate(source, key, predicate) {
    var container = source[key];

    if(container) {
        var value = removeByPredicate(container, predicate);
        if(container.length == 0) delete source[key];
        return value;
    }
}

function removeAllByPredicate(container, predicate) {
    for(var i=0; i<container.length; i++) {
        if(predicate(container[i]) === true) {
            container.splice(i, 1);
            i--;
        }
    }
}

function removeAllFromMapByPredicate(source, key, predicate) {
    var container = source[key];

    if(container) { 
        removeAllByPredicate(container, predicate);
        if(container.length == 0) delete source[key];
    }
}

exports.getOrCreateContainer = getOrCreateContainer;
exports.enqueueToMap = enqueueToMap;
exports.dequeueFromMap = dequeueFromMap;
exports.removeByPredicate = removeByPredicate;
exports.removeFromMapByPredicate = removeFromMapByPredicate;
exports.removeAllByPredicate = removeAllByPredicate;
exports.removeAllFromMapByPredicate = removeAllFromMapByPredicate;