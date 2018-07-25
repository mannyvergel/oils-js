const moment = require('moment');

exports.formatReadableDateTime = function(date) {
  return moment(date).calendar();
}

exports.formatDate = function(date, format) {
  return moment(date).format(format);
}