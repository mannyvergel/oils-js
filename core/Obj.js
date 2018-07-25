//let set = require('function-name');
// A simple class system, more documentation to come

function extend(cls, name, props) {
    // This does that same thing as Object.create, but with support for IE8
    let F = function() {};
    F.prototype = cls.prototype;
    let prototype = new F();

    let fnTest = /xyz/.test(function(){ xyz; }) ? /\bparent\b/ : /.*/;
    props = props || {};

    for(let k in props) {
        let src = props[k];
        let parent = prototype[k];

        if(typeof parent == "function" &&
           typeof src == "function" &&
           fnTest.test(src)) {
            prototype[k] = (function (src, parent) {
                return function() {
                    // Save the current parent method
                    let tmp = this.parent;

                    // Set parent to the previous method, call, and restore
                    this.parent = parent;
                    let res = src.apply(this, arguments);
                    this.parent = tmp;

                    return res;
                };
            })(src, parent);
        }
        else {
            prototype[k] = src;
        }
    }

    prototype.typename = name;

    let new_cls = function() { 
        if(prototype.init) {
            prototype.init.apply(this, arguments);
        }
    };

    new_cls.prototype = prototype;
    new_cls.prototype.constructor = new_cls;

    new_cls.extend = function(name, props) {
        if(typeof name == "object") {
            props = name;
            name = "anonymous";
        }
        //for more reliable stack trace
        //commented since not working in latest build, fix soon
        //set(this, name);
        return extend(new_cls, name, props);
    };

    return new_cls;
}

module.exports = extend(Object, "Object", {});
