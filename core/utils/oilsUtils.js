var extend = require('node.extend');
var fs = require('fs');
var getMimeType = require('simple-mime')('application/octet-stream');

module.exports = {
	extend: extend,
	serveStaticFile: function(path, res, contentType) {
		fs.readFile(web.conf.baseDir + path, function(err, data) {
			if (err) {
				throw err;
			}
			
			if (!contentType) {
				//auto detect mime type
				contentType = getMimeType(path);
			}

        	res.writeHead(200, {'Content-Type': contentType})
        	res.end(data);
		})
	},
	serveBuffer: function(buffer, filename, res, contentType) {
		if (!contentType) {
			//auto detect mime type
			contentType = getMimeType(filename);
		}

    	res.writeHead(200, {'Content-Type': contentType})
    	res.end(buffer);
	},
	downloadBuffer: function(buffer, filename, res, contentType) {
		if (!contentType) {
			//auto detect mime type
			contentType = getMimeType(filename);
		}

		res.setHeader('Content-disposition', 'attachment; filename=' + filename);

    	res.writeHead(200, {'Content-Type': contentType})
    	res.end(buffer);
	},
}