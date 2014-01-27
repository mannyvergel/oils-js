var fs = require('fs');
var stringUtils = require('./stringUtils');
exports.recurseJs = function(dir, callback, subfolder) {
	subfolder = subfolder || '';
	var pathToSearch = global.base_dir + dir + subfolder;
	if (oils.isDebug) {
		console.log('Path to search: ' + pathToSearch);
	}

	fs.readdir(pathToSearch, function(err, files) {
		if (err) {
			throw new Error('Error reading dir ' + pathToSearch);
		} else {
			for (var i in files) {
				var file = files[i];
				if (stringUtils.endsWith(file, '.js')) {
					handleFile(dir, subfolder, file, callback);
				}
			}
			
		}
		
	});
}



function handleFile(dir, subfolder, file, callback) {
	var pathToSearch = global.base_dir + dir + subfolder;
	var absPath = pathToSearch + '/' + file;
	
	fs.stat(absPath, function(err, stat) {
		var opts = {
			origDir: dir,
			subfolder: subfolder,
			folder: pathToSearch,
			absolutePath: absPath,
			file: file,
			name: file.slice(0, file.indexOf('.js')) //TODO: this assumes js files only 
		}
		if (stat && stat.isDirectory()) {
			opts.isDirectory = function() {
				return true;
			}
			exports.recurseJs(dir, callback, subfolder + '/' + file);
			callback(null, opts);
		} else {
			opts.isDirectory = function() {
				return false;
			}
			callback(null, opts);
		}
	});
}