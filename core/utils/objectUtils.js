'use strict';

exports.isArray = function(a) {
  return Array.isArray(a);
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

exports.resolvePath = function(object, path, {defaultValue}={}) {
  return path.split('.').reduce((o, p) => o ? o[p] : defaultValue, object)
}
