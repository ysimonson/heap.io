// Via http://groups.google.com/group/nodejs/browse_thread/thread/1c28d4adc88c4c0b
// Queue implemented as an array of small arrays.  Each smaller array is max 512 long. 
function Queue() { 
    var args = Array.prototype.slice.call(arguments); 
    this.length = args.length; 
    this.toplevel = []; 

    while(args.length > 512) { 
        this.toplevel.push(args.splice(0, 512)); 
    } 

    this.toplevel.push(args); 
}; 

Queue.prototype.dequeue = function() { 
    var arraylet = this.toplevel[0]; 
    if (arraylet.length == 1) this.toplevel.shift(); 
    this.length--; 
    return arraylet.shift(); 
};

Queue.prototype.enqueue = function(item) { 
    var self = this;

    var addArraylet = function() {
        var newArraylet = new Array(512);
        newArraylet.length = 0;
        self.toplevel.push(newArraylet);
    }

    if(this.toplevel.length == 0) addArraylet();
    var arraylet = this.toplevel[this.toplevel.length - 1]; 
    arraylet.push(item); 
    if (arraylet.length == 512) addArraylet();
    this.length++; 

    return item; 
};

Queue.prototype.removeByPredicate = function(predicate) {
    for(var i=0; i<this.toplevel.length; i++) {
        var arraylet = this.toplevel[i];

        for(var j=0; j<arraylet.length; j++) {
            if(predicate(arraylet[j]) === true) {
                if(arraylet.length == 1) this.toplevel.splice(i, 1);
                this.length--;
                return arraylet.splice(j, 1)[0];
            }
        }
    }
};

Queue.prototype.toString = function() {
    var allValues = [];

    for(var i=0; i<this.toplevel.length; i++) {
        allValues = allValues.concat(this.toplevel[i]);
    }

    return allValues.join(",");
};

function QueueMap() {
    this.map = {};
};

QueueMap.prototype.dequeue = function(key) {
    var container = this.map[key];

    if(container) {
        var item = container.dequeue();
        if(container.length == 0) delete this.map[key];
        return item;
    }
};

QueueMap.prototype.enqueue = function(key, item) {
    var container = this.map[key];
    if(!container) this.map[key] = container = new Queue();
    container.enqueue(item);
};

exports.Queue = Queue;
exports.QueueMap = QueueMap;
