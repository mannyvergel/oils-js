'use strict';

const extend = Object.assign;
const fs = require('fs');
const path = require('path');
const getMimeType = require('simple-mime')('application/octet-stream');

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
	//because of the ability to change the context of the public folder
	//some icons like favico, sitemap, robots.txt are still best served in root
	routesFromPublicFolderToRootPath: function(arrPathFromRoot) {
		if (arrPathFromRoot) {
			let routes = {};
			for (let pathFromRoot of arrPathFromRoot) {
		    routes['/' + pathFromRoot] = {
		    	get: function(req, res) {
			      web.utils.serveStaticFile(path.join(web.conf.publicDir, pathFromRoot), res);
			    }
		    }
		  }

		  return routes;
		}

		return null;
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
	getMimeType: getMimeType,

	getClientIp: function(req) {
		let forwarded = req.headers['x-forwarded-for'];
		let ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;

		return ip;
	}
}