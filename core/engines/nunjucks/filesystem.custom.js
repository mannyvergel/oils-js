
var nunjucks = require('nunjucks');
var fs = require('fs');

module.exports = nunjucks.FileSystemLoader.extend({
   
    getSource: function(name) {

      if (!(name && name[0] == '/')) {
        return this.parent(name);
      }

      var fullpath = name;
      if (!web.stringUtils.startsWith(name, web.conf.baseDir)) {
      	fullpath = web.conf.baseDir + name;
      }
       

      this.pathsToNames[fullpath] = name;

      return { src: fs.readFileSync(fullpath, 'utf-8'),
               path: fullpath, noCache: this.noCache };
    }
});