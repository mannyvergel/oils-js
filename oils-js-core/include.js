module.exports = function(override) {
	if (!global.include) {

		if (!global.BASE_DIR) {
			global.BASE_DIR = process.cwd();
		}

		global.include = function(file) {
			if (file && file[0] == '/') {
				return require(global.BASE_DIR + file);
			} else {
				return require(file);
			}
		}
	}

}
