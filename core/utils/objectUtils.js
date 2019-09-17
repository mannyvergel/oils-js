'use strict';

exports.isArray = function(a) {
    return (!!a) && (a.constructor === Array);
};

exports.isObject = function(a) {
    return (!!a) && (a.constructor === Object);
};

exports.isFunction = function(a) {
    return (!!a) && (a instanceof Function);
};


exports.isString = function(a) {
    return (!!a) && (typeof a === 'string');
}