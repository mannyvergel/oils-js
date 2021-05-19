#!/usr/bin/env node

'use strict';

const { program } = require('commander');
const fs = require('fs');
const fileUtils = require('../core/utils/fileUtils.js');

program
  .version(require('../package.json').version)
  .command('new <project_name>')
  .description('New Project')
  .option('-t, --template <template>', 'Template to use', 'basic')
  
  .action((project_name, options) => {
    newProject(project_name, options.template)
  });

program.parse(process.argv);


function newProject(name, template) {
  let folderName = name;

  if (fs.existsSync(folderName)) {
    console.log('Folder name already exists. Aborting.'); 
  } else {

    fileUtils.copySync(__dirname + '/../templates/' + template, folderName);

    fs.renameSync(folderName + '/template.gitignore', folderName + '/.gitignore');

  }

}
