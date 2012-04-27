exports.fullMatch = function(pattern, str) {
    //TODO: since we're only looking for complete matches, would it be a legal heuristic to check of results.length === 1?
    var results = pattern.exec(str);

    if(results) {
        for(var i=0; i<results.length; i++) {
            if(results[i].length == str.length) return true;
        }
    }

    return false;
}