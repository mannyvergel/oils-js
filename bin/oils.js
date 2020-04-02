#!/usr/bin/env node

'use strict';

const parser = require("nomnom");
const fs = require('fs');
const fileUtils = require('../core/utils/fileUtils.js');

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

  if (fs.existsSync(folderName)) {
    console.log('Folder name already exists. Aborting.'); 
  } else {

    fileUtils.copySync(__dirname + '/../templates/basic', folderName);

    fs.renameSync(folderName + '/template.gitignore', folderName + '/.gitignore');

  }

}
