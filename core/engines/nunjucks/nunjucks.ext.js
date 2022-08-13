'use strict';

const moment = require('moment-timezone');

module.exports = function customiseNunjucks(nunjucksEnv) {
  nunjucksEnv.addFilter('date', function(date, format, timezone) {
    if (!date) {
      return null;
    }

    let timezoneToUse = timezone || web.conf.timezone;
    let dFormatted;
    if (timezoneToUse) {
      dFormatted = moment.tz(date, timezoneToUse).format(format)
    } else {
      dFormatted = moment(date).format(format);
    }

    return dFormatted;
  });

  nunjucksEnv.addFilter('formatNum', function(num) {
    return num && num.toLocaleString();
  });

  nunjucksEnv.addExtension('MarkedExtension', new MarkedExtension());
}

const marked = require('marked');

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = (new JSDOM('')).window;
const DOMPurify = createDOMPurify(window);

function MarkedExtension() {

  const markedOptions = Object.assign(
  {
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: true,
    pedantic: false,
    smartLists: true,
    smartypants: false
  }, web.conf.markedOptions
  );
  
  marked.setOptions(markedOptions);

  this.tags = ['marked'];
  this.autoescape = false;
  this.parse = function(parser, nodes, lexer) {
      // get the tag token
      let tok = parser.nextToken();

      // parse the args and move after the block end. passing true
      // as the second arg is required if there are no parentheses
      //let args = parser.parseSignature(null, true);
      parser.advanceAfterBlockEnd(tok.value);
      let args = null;
      // parse the body and possibly the error block, which is optional
      let body = parser.parseUntilBlocks('endmarked');
     
      parser.advanceAfterBlockEnd();

      // See above for notes about CallExtension
      return new nodes.CallExtension(this, 'run', args, [body]);
  };

  this.run = function(context, body) {

      if (!body) {
        return "";
      }
      let ret = DOMPurify.sanitize(marked.parse(body()));

      return ret;
  };
}
