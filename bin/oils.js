#!/usr/bin/env node

var argv = require('optimist').argv;
var myArgs = process.argv.slice(2);

var fs = require('fs');

/**
Usage: oils new [project_name]
**/
if (myArgs[0] == 'new') {
	var folderName = myArgs[1];
	if (folderName) {
		if (fs.existsSync(folderName)) {
			console.log('Folder name already exists. Aborting.'); 
		} else {
			//fs.mkdirSync(folderName);
			var ncp = require('ncp');
			ncp(__dirname + '/../template', folderName, function(err) {
				if (err) {
					console.error('Error copying: ' + err);
				} else {
					try {
           fs.renameSync(folderName + '/template.gitignore', folderName + '/.gitignore');
         } catch(e) {
						//ignore
					}
					console.log(folderName + ' project created.');
				}
			})			
		}
		
	} else {
		console.log('Usage: oils new [folder name]');	
	}
} else {
	console.log('Usage: oils new [folder name]');
}
