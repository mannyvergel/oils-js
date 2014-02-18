#!/usr/bin/env node
var parser = require("nomnom");
var fs = require('fs-extra');

parser.command('new')
.options({
  name: {
   position: 1,
   help: "Project name",
   required: true
 },
 template: {
   abbr: 't',
   help: "Template to use e.g. zurb5"
 }
})
.callback(function(opts) {
  newProject(opts);
})
.help("create new project");

parser.parse();


function newProject(opts) {
  var folderName = opts.name;
  //console.log('NEW PROJECT TO ' + folderName);

  if (fs.existsSync(folderName)) {
    console.log('Folder name already exists. Aborting.'); 
  } else {

    fs.copySync(__dirname + '/../templates/basic', folderName);

    if (opts.template == "zurb5") {
      fs.copySync(__dirname + '/../templates/zurb5', folderName);  
    }

    fs.renameSync(folderName + '/template.gitignore', folderName + '/.gitignore');
    /*
    //fs.mkdirSync(folderName);
    var ncp = require('ncp');
    ncp(__dirname + '/../templates/basic', folderName, function(err) {
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
    */   
  }

}

/*
var opts = require("nomnom")
   .script("new")
   .options({
      path: {
         position: 0,
         help: "Folder name",
         list: true
      },
      template: {
         abbr: 't',
         help: "Template to use e.g. zurb5"
      }
   }).parse();
*/

/*
var argv = require('optimist').argv;
var myArgs = process.argv.slice(2);

var fs = require('fs');


//Usage: oils new [project_name]

if (myArgs[0] == 'new') {
  var folderName = myArgs[1];
  if (folderName) {
    if (fs.existsSync(folderName)) {
      console.log('Folder name already exists. Aborting.'); 
    } else {
      //fs.mkdirSync(folderName);
      var ncp = require('ncp');
      ncp(__dirname + '/../templates/basic', folderName, function(err) {
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

*/