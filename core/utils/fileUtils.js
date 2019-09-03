const fs = require('fs');
const joinPath = require('path.join');

const fsExtra = require('fs-extra');

exports.joinPath = joinPath;

Object.assign(exports, fsExtra);

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
      throw new Error('Error reading dir ' + pathToSearch);
    } else {
      for (let i in files) {
        let file = files[i];
        handleFile(true, dir, subfolder, file, callback);
        
      }
      
    }
    
  });
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



function handleFile(recurse, dir, subfolder, file, callback) {
  if (exports.isHidden(dir)) {
    return;
  }
  let pathToSearch = dir + subfolder;
  let absPath = pathToSearch + '/' + file;
  
  fs.stat(absPath, function(err, stat) {
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
      if (recurse) {
        exports.recurseDir(dir, callback, subfolder + '/' + file);
      }
      
      callback(null, opts);
    } else {
      opts.isDirectory = function() {
        return false;
      }
      callback(null, opts);
    }
  });
}

function isUnixHiddenPath(path) {
  return (/(^|.\/)\.+[^\/\.]/g).test(path);
};