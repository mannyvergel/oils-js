var fs = require('fs');
var joinPath = require('path.join');

exports.joinPath = joinPath;

exports.recurseDir = function(dir, callback, subfolder) {
  if (!dir) {
    throw new Error('dir cannot be null');
  }
  subfolder = subfolder || '';
  var pathToSearch = dir + subfolder;
  if (console.isDebug) {
    console.debug('Path to search: ' + pathToSearch);
  }

  fs.readdir(pathToSearch, function(err, files) {
    if (err) {
      throw new Error('Error reading dir ' + pathToSearch);
    } else {
      for (var i in files) {
        var file = files[i];
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
  var pathToSearch = dir + subfolder;
  if (console.isDebug) {
    console.debug('Path to search: ' + pathToSearch);
  }

  fs.readdir(pathToSearch, function(err, files) {
    if (err) {
      throw new Error('Error reading dir ' + pathToSearch);
    } else {
      for (var i in files) {
        var file = files[i];
        
        handleFile(false, dir, subfolder, file, callback);
        
        
      }
      
    }
    
  });
}

exports.readRootDirOnlySync = function(dir, callback) {
  if (!dir) {
    throw new Error('dir cannot be null');
  }

  var pathToSearch = dir;
  if (console.isDebug) {
    console.debug('Path to search: ' + pathToSearch);
  }

  var filteredFiles = [];
  var arrFiles = fs.readdirSync(pathToSearch);
  for (var i in arrFiles) {
    var file = arrFiles[i];
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
  var pathToSearch = dir + subfolder;
  var absPath = pathToSearch + '/' + file;
  
  fs.stat(absPath, function(err, stat) {
    var opts = {
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