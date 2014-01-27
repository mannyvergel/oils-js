if (global.isTest) {
	global.base_dir = process.cwd() + '/template';
} else {
	global.base_dir = process.cwd();
}

global.include = function(file) {
  return require(base_dir + file);
}