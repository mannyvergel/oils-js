'use strict';

const escapeHtml = require('escape-html');

exports.endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

exports.startsWith = function (str, startsWith){
  if (!str || !startsWith) {
    return false;
  }
  return str.indexOf(startsWith) === 0;
}

exports.escapeRegexp = function(str) {
	return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

exports.trim = function(aStr) {
	if (!aStr) {
		return "";
	}
	return aStr.replace(/^\s+|\s+$/g, '');
}

exports.capitalize = function(aStr) {
	return aStr[0].toUpperCase() + aStr.slice(1);
}

exports.isEmpty = function(str) {
  // do not use strict equality for null, to handle undefined
	return str == null || str.length == 0;
}

exports.escapeHTML = function(str) {
  if (str === null || str === undefined) {
    return '';
  }
  
  return escapeHtml(str);
}

exports.genSecureRandomString = function(byteLen, cb) {

  //byteLen usual vals = 48, 32, 24, 16

  return new Promise(function(resolve, reject) {
   
    let useByteLen = byteLen || web.conf.defaultRandomStringByteLength || 16;
    require('crypto').randomBytes(useByteLen, function(err, buffer) {
      if (err) {
        throw err;
      }

      let token = buffer.toString('hex');

      if (cb) {
        cb(err, token);
      }
      
      resolve(token);
    });
    
      
    
  });
}
