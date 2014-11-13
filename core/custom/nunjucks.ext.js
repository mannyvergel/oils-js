// var moment = require('moment');
// var customFilters = function(nunjucksEnv) {
// 	nunjucksEnv.addFilter('date', function(date, format) {
// 	      var s = moment(date).format(format);
// 	      return s;
// 	    });

// 	nunjucksEnv.addExtension('MarkedExtension', new MarkedExtension());
// }

// module.exports = customFilters;



// function MarkedExtension() {
// 	var marked = require('marked');
// 	marked.setOptions({
// 	  renderer: new marked.Renderer(),
// 	  gfm: true,
// 	  tables: true,
// 	  breaks: false,
// 	  pedantic: false,
// 	  sanitize: false,
// 	  smartLists: true,
// 	  smartypants: false
// 	});

//     this.tags = ['marked'];
//     this.autoescape = false;
//     this.parse = function(parser, nodes, lexer) {
//         // get the tag token
//         var tok = parser.nextToken();

//         // parse the args and move after the block end. passing true
//         // as the second arg is required if there are no parentheses
//         //var args = parser.parseSignature(null, true);
//         parser.advanceAfterBlockEnd(tok.value);
//         var args = null;
//         // parse the body and possibly the error block, which is optional
//         var body = parser.parseUntilBlocks('endmarked');
       
//         parser.advanceAfterBlockEnd();

//         // See above for notes about CallExtension
//         return new nodes.CallExtension(this, 'run', args, [body]);
//     };

//     this.run = function(context, body) {

//         if (!body) {
//         	return "";
//         }
//         var ret = marked(body());

//         return ret;
//     };
// }