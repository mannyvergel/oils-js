'use strict';

const fs = require('fs');
const util = require('util');
const readdirProm = util.promisify(fs.readdir);
const statProm = util.promisify(fs.stat);
const path = require('path');

// use handleEachFromDir for async
exports.recurseDir = function(dir, callback, subfolder) {
  if (!dir) {
    throw new Error('dir cannot be null');
  }
  subfolder = subfolder || '';
  let pathToSearch = dir + subfolder;
  if (console.isDebug) {
    console.debug('Path to search: ' + pathToSearch);
  }

  fs.readdir(pathToSearch, function(err, files) {
    if (err) {
      callback(new Error('Error reading dir ' + pathToSearch));
      return;
    } else {
      for (let i in files) {
        let file = files[i];
        handleFile(true, dir, subfolder, file, callback);
      }
      
    }
    
  });
}

exports.copySync = function(src, dest, {force}={}) {
  let destExists = fs.existsSync(dest);
  if (destExists) {
    if (force) {
      exports.removeDirSync(dest);
    } else {
      throw new Error("Directory exists. Use {force: true}")
    }
  }

  let exists = fs.existsSync(src);
  let stats = exists && fs.statSync(src);
  let isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest);
    fs.readdirSync(src).forEach(function(childItemName) {
      exports.copySync(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

exports.removeDirSync = function(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            let entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                exports.removeDirSync(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}

exports.handleEachFromDir = async function(dir, {origDir}={}, handler) {
  if (!dir) {
    throw new Error('dir cannot be null');
  }

  if (!origDir) {
    origDir = dir;
  }

  let subfolder = dir.substr(origDir.length);

  let pathToSearch = dir;
  if (console.isDebug) {
    console.debug('Path to search:', pathToSearch);
  }

  let files = await readdirProm(pathToSearch);

  for (let file of files || []) {
    let absPath = path.join(pathToSearch, file);

    let stat = await statProm(absPath);
    let opts = optFromStat(stat, {
      dir, subfolder, file, pathToSearch, absPath
    });

    await handler(null, opts);

    if (opts.isDirectory()) {
      await exports.handleEachFromDir(absPath, {origDir: dir}, handler);
    }
  }

}

exports.isHidden = function(path) {
  //unix support
  return isUnixHiddenPath(path);
}


exports.readRootDirOnly = function(dir, callback, subfolder) {
  if (!dir) {
    throw new Error('dir cannot be null');
  }
  subfolder = subfolder || '';
  let pathToSearch = dir + subfolder;
  if (console.isDebug) {
    console.debug('Path to search: ' + pathToSearch);
  }

  fs.readdir(pathToSearch, function(err, files) {
    if (err) {
      throw new Error('Error reading dir ' + pathToSearch);
    } else {
      for (let i in files) {
        let file = files[i];
        
        handleFile(false, dir, subfolder, file, callback);
        
        
      }
      
    }
    
  });
}

exports.readRootDirOnlySync = function(dir, callback) {
  if (!dir) {
    throw new Error('dir cannot be null');
  }

  let pathToSearch = dir;
  if (console.isDebug) {
    console.debug('Path to search: ' + pathToSearch);
  }

  let filteredFiles = [];
  let arrFiles = fs.readdirSync(pathToSearch);
  for (let i in arrFiles) {
    let file = arrFiles[i];
    if (!exports.isHidden(file)) {
      filteredFiles.push(file);
    }
  }

  return filteredFiles;
}


function optFromStat(stat, {
  dir, subfolder, file, pathToSearch, absPath
}) {

  let opts = {
    origDir: dir,
    subfolder: subfolder,
    folder: pathToSearch,
    absolutePath: absPath,
    file: file,
    name: file.slice(0, file.indexOf('.js')) //TODO: this assumes js files only 
  }

  if (stat && stat.isDirectory()) {
    opts.isDirectory = function() {
      return true;
    }
  } else {
    opts.isDirectory = function() {
      return false;
    }
  }

  return opts;
}

function handleFile(recurse, dir, subfolder, file, callback) {
  if (exports.isHidden(dir)) {
    return;
  }
  let pathToSearch = dir + subfolder;
  let absPath = pathToSearch + '/' + file;
  
  fs.stat(absPath, function(err, stat) {
    let opts = optFromStat(stat, {
      dir, subfolder, file, pathToSearch, absPath
    })

    if (opts.isDirectory()) {
      if (recurse) {
        exports.recurseDir(dir, callback, subfolder + '/' + file);
      }
    } else {
      callback(null, opts);
    }

  });
}

function isUnixHiddenPath(path) {
  return (/(^|.\/)\.+[^\/\.]/g).test(path);
};