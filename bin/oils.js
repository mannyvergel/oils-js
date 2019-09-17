#!/usr/bin/env node

'use strict';

let parser = require("nomnom");
let fs = require('fs-extra');

parser.command('new')
.options({
  name: {
   position: 1,
   help: "Project name",
   required: true
 },
 template: {
   abbr: 't',
   help: "Template to use e.g. basic"
 }
})
.callback(function(opts) {
  newProject(opts);
})
.help("create new project");

parser.parse();


function newProject(opts) {
  let folderName = opts.name;
  //console.log('NEW PROJECT TO ' + folderName);

  if (fs.existsSync(folderName)) {
    console.log('Folder name already exists. Aborting.'); 
  } else {

    fs.copySync(__dirname + '/../templates/basic', folderName);

    fs.renameSync(folderName + '/template.gitignore', folderName + '/.gitignore');

  }

}