var nunjucks = require('nunjucks');
var path = require('path');
//just define the ff:
module.exports = function(templatesPath) {
	var env = nunjucks.configure(templatesPath, {autoescape: true});
	customiseNunjucks(env);

	function expressEngine(name, opts) {
		this.name          = name;
		this.path          = name;
		this.defaultEngine = opts.defaultEngine;
		this.ext           = path.extname(name);
		if (!this.ext && !this.defaultEngine) throw new Error('No default engine was specified and no extension was provided.');
		if (!this.ext) this.name += (this.ext = ('.' !== this.defaultEngine[0] ? '.' : '') + this.defaultEngine);
	}

    expressEngine.prototype.render = function(opts, cb) {
      env.render(this.name, opts, cb);
    };

	return expressEngine;
}


var moment = require('moment');
function customiseNunjucks(nunjucksEnv) {
	nunjucksEnv.addFilter('date', function(date, format) {
	      var s = moment(date).format(format);
	      return s;
	    });

	nunjucksEnv.addExtension('MarkedExtension', new MarkedExtension());
}


function MarkedExtension() {
	var marked = require('marked');
	marked.setOptions({
	  renderer: new marked.Renderer(),
	  gfm: true,
	  tables: true,
	  breaks: false,
	  pedantic: false,
	  sanitize: false,
	  smartLists: true,
	  smartypants: false
	});

    this.tags = ['marked'];
    this.autoescape = false;
    this.parse = function(parser, nodes, lexer) {
        // get the tag token
        var tok = parser.nextToken();

        // parse the args and move after the block end. passing true
        // as the second arg is required if there are no parentheses
        //var args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        var args = null;
        // parse the body and possibly the error block, which is optional
        var body = parser.parseUntilBlocks('endmarked');
       
        parser.advanceAfterBlockEnd();

        // See above for notes about CallExtension
        return new nodes.CallExtension(this, 'run', args, [body]);
    };

    this.run = function(context, body) {

        if (!body) {
        	return "";
        }
        var ret = marked(body());

        return ret;
    };
}