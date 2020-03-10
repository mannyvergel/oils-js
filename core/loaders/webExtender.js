'use strict';

const fileUtils = require('../utils/fileUtils.js');
const path = require('path');
const fs = require('fs');

exports.load = function(web, extendPath, context) {

  const objContext = Object.assign({}, context);

  const deepestObj = getDeepestObj(objContext);

  const fullExtPath = path.join(web.conf.baseDir, extendPath);

  if (fs.existsSync(fullExtPath)) {
    let fileList = fs.readdirSync(fullExtPath);

    if (fileList) {
      for (let file of fileList) {
        if (web.stringUtils.endsWith(file, '.js') && !fileUtils.isHidden(file)) {
          // support extending existing utils in the future
          // this will currently overwrite if existing
          let key = file.substr(0, file.length - 3);
          deepestObj[key] = require(path.join(fullExtPath, file));
        }
      }
    }

    Object.assign(web, objContext);
  }
}

function getDeepestObj(obj) {

  if (isEmpty(obj)) {
    return obj;
  }

  for (let key in obj) {
    return getDeepestObj(obj[key]);
  }

  throw new Error("Cannot get the deepest object");
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}