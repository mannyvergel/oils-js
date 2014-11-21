var extend = require('node.extend');
var fs = require('fs');

module.exports = {
	extend: extend,
	serveStaticFile: function(path, res, contentType) {
		fs.readFile(web.conf.baseDir + path, function(err, data) {
			if (err) {
				throw err;
			}
			
			if (!contentType) {
				//auto detect mime type
				var getMimeType = require('simple-mime')('application/octect-stream');
				contentType = getMimeType(path);
			}

        	res.writeHead(200, {'Content-Type': contentType})
        	res.end(data);
		})
	}
}