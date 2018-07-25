const escapeHtml = require('escape-html');

exports.endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

exports.startsWith = function (str, startsWith){
  if (!str || !startsWith) {
    return false;
  }
  return str.indexOf(startsWith) == 0;
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
	return str == null || str.length == 0;
}

exports.escapeHTML = function(str) {
  return escapeHtml(str);
}
