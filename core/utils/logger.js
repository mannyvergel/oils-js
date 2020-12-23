'use strict';

module.exports = function(webSelf) {

  if (!webSelf.conf.logger.replaceWith) {
    let logger = {};
    logger.info = console.log.bind(logger);
    logger.debug = console.debug.bind(logger);
    logger.warn = console.warn.bind(logger);
    logger.error = console.error.bind(logger);

    return logger;
  } else if (webSelf.conf.logger.replaceWith === 'winston') {
    return replaceWithWinstonLogger(webSelf);
  } else {
    throw new Error("Unsupported logger", webSelf.conf.logger.replaceWith);
  }
  
}


function replaceWithWinstonLogger(webSelf) {
  const { createLogger, format, transports } = require('winston');
  require('winston-daily-rotate-file');

  const colorizer = format.colorize();

  const path = require('path');

  const util = require('util');

  const {combine, timestamp, printf} = format;
  const SPLAT = Symbol.for('splat');

  const timezoned = () => {
    let timestampConf = {};
    if (web.conf.timezone) {
      timestampConf.timeZone = web.conf.timezone;
    }

    timestampConf.hour12 = false;
    timestampConf.timeZoneName = 'short';

    return (new Date().toLocaleString('en-US', timestampConf)).replace(', ', ' ');
  }

  let workerInfo = '';

  if (web.conf.logWorkerId) {
    workerInfo = `[worker_${web.id}] `;
  }


  const logFormat = combine(
      timestamp({format: timezoned}),
      printf(({timestamp, level, message, [SPLAT]: args = []}) => {
        let leftSide = `${workerInfo}${timestamp} - ${level}:`;
        return `${leftSide} ${util.format(message, ...args)}`
      })
  )

  const consoleLogFormat = combine(
      timestamp({format: timezoned}),
      printf(({timestamp, level, message, [SPLAT]: args = []}) => {
        let leftSide = `${workerInfo}${timestamp} - ${level}:`;
        return`${colorizer.colorize(level, leftSide)} ${util.format(message, ...args)}`
      }),
      
  )

  let myTransports = [
    new transports.Console({
      format: consoleLogFormat
    })
  ]

  if (webSelf.conf.logger.winston.logToFile.enabled) {

    const fs = require('fs');
    let logDir = webSelf.conf.logDir || webSelf.conf.logger.dir;
    if (!web.stringUtils.startsWith(logDir, '/')) {
      logDir = path.join(web.conf.baseDir, logDir);
    }

    // Create the log directory if it does not exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, {recursive: true});
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

