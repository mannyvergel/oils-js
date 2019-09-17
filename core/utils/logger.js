'use strict';

module.exports = function(webSelf) {

  if (!webSelf.conf.logger.replaceWith) {
    let logger = {};
    logger.info = console.log.bind(logger);
    logger.debug = console.debug.bind(logger);
    logger.warn = console.warn.bind(logger);
    logger.error = console.error.bind(logger);

    return logger;
  } else if (webSelf.conf.logger.replaceWith == 'winston') {
    return replaceWithWinstonLogger(webSelf);
  } else {
    throw new Error("Unsupported logger", webSelf.conf.logger.replaceWith);
  }
  
}


function replaceWithWinstonLogger(webSelf) {
  const { createLogger, format, transports } = require('winston');
  require('winston-daily-rotate-file');

  const path = require('path');

  const util = require('util');
  const winston = require('winston');
  const {combine, timestamp, printf} = winston.format;
  const SPLAT = Symbol.for('splat');


  const logFormat = combine(
      timestamp(),
      printf(({timestamp, level, message, [SPLAT]: args = []}) =>
          `${timestamp} - ${level}: [${path.basename(process.mainModule.filename)}] ${util.format(message, ...args)}`)
  )

  const consoleLogFormat = combine(
      timestamp(),
      format.colorize(),
      printf(({timestamp, level, message, [SPLAT]: args = []}) =>
          `${timestamp} - ${level}: [${path.basename(process.mainModule.filename)}] ${util.format(message, ...args)}`),
      
  )

  let myTransports = [
    new transports.Console({
      format: consoleLogFormat
    })
  ]

  if (webSelf.conf.logger.winston.logToFile.enabled) {

    const fs = require('fs');
    const logDir = webSelf.conf.logger.dir;

    // Create the log directory if it does not exist
    if (!fs.existsSync(logDir)) {
      web.fileUtils.mkdirsSync(logDir);
    }
    if (webSelf.conf.logger.winston.logToFile.dailyRotate.enabled) {
      let rotateConf = webSelf.conf.logger.winston.logToFile.dailyRotate;
      rotateConf.filename = `${logDir}/${rotateConf.filenameFormat}`;

      const dailyRotateFileTransport = new transports.DailyRotateFile(rotateConf);

      myTransports.push(dailyRotateFileTransport);
    } else {
      const filename = path.join(logDir, 'results.log');
      myTransports.push(new transports.File({
        filename,
        format: logFormat
      }))
    }
  }
  

  

  const logger = createLogger({
    // change level if in dev environment versus production
    level: webSelf.conf.isDebug ? 'debug' : 'info',
    format: logFormat,
    transports: myTransports
  });


  console.log = logger.info.bind(logger);
  console.debug = logger.debug.bind(logger);
  console.warn = logger.warn.bind(logger);
  console.error = logger.error.bind(logger);

  return logger;
}

