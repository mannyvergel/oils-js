exports.endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
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