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

  }

}