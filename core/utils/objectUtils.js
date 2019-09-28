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

exports.isClass = function(a) {
  // Maybe in the future js versions, there will be more efficient check than this
  return (!!a) && (typeof a === 'function' && /^\s*class\s+/.test(a.toString()));
}

exports.isString = function(a) {
  return (!!a) && (typeof a === 'string');
}