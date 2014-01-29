var constants = require('./constants');
module.exports = function(override) {
	if (!global.includeController) {
		var dir = override || (global.BASE_DIR + constants.CONTROLLERS_DIR);

		global.includeController = function(file) {
			return require(dir + file);
		}
	}

}
