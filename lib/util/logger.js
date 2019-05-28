/* eslint quote-props:0 */
var util = require('util')
var events = require('events')

var chalk = require('chalk')

Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
    "H+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    "S": this.getMilliseconds() //毫秒
  };
  var week = {
    "0": "/u65e5",
    "1": "/u4e00",
    "2": "/u4e8c",
    "3": "/u4e09",
    "4": "/u56db",
    "5": "/u4e94",
    "6": "/u516d"
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  if (/(E+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }
  return fmt;
}

var fs = require('fs');
var logspath = __dirname + "/../../logs/"

if (!fs.existsSync(logspath)) {
  fs.mkdir(logspath, err => {
    if (err) {
      console.log(new Date().toLocaleString() + ":" + err)
    } else {
      console.log(new Date().toLocaleString() + ": mkdir OK")
    }
  })
}

var stdWrite = process.stdout.write;
var errorWrite = process.stderr.write;
process.stdout.write = function (d) {
  var this1 = this
  var args = arguments
  stdWrite.apply(this, arguments)
  // Concurrency safe
  var dstr = (new Date().Format("yyyy-MM-dd")) + ".log"
  var logfile = __dirname + "/../../logs/" + dstr;
  fs.appendFileSync(logfile, new Date().toLocaleString() + " : " + d, function (res) {

  });
};

process.stderr.write = function (d) {
  var this1 = this
  var args = arguments
  // Concurrency safe
  errorWrite.apply(this, args);
  var dstr = (new Date().Format("yyyy-MM-dd")) + ".log"
  var logfile = __dirname + "/../../logs/" + dstr;
  fs.appendFileSync(logfile, new Date().toLocaleString() + " [Error] : " + d, function (res) {

  });
};

var Logger = new events.EventEmitter()
Logger.Level = {
  DEBUG: 1
  , VERBOSE: 2
  , INFO: 3
  , IMPORTANT: 4
  , WARNING: 5
  , ERROR: 6
  , FATAL: 7
}

// Exposed for other modules
Logger.LevelLabel = {
  1: 'DBG'
  , 2: 'VRB'
  , 3: 'INF'
  , 4: 'IMP'
  , 5: 'WRN'
  , 6: 'ERR'
  , 7: 'FTL'
}

Logger.globalIdentifier = '*'

function Log(tag) {
  this.tag = tag
  this.names = {
    1: 'DBG'
    , 2: 'VRB'
    , 3: 'INF'
    , 4: 'IMP'
    , 5: 'WRN'
    , 6: 'ERR'
    , 7: 'FTL'
  }
  this.styles = {
    1: 'grey'
    , 2: 'cyan'
    , 3: 'green'
    , 4: 'magenta'
    , 5: 'yellow'
    , 6: 'red'
    , 7: 'red'
  }
  this.localIdentifier = null
  events.EventEmitter.call(this)
}

util.inherits(Log, events.EventEmitter)

Logger.createLogger = function (tag) {
  return new Log(tag)
}

Logger.setGlobalIdentifier = function (identifier) {
  Logger.globalIdentifier = identifier
  return Logger
}

Log.Entry = function (timestamp, priority, tag, pid, identifier, message) {
  this.timestamp = timestamp
  this.priority = priority
  this.tag = tag
  this.pid = pid
  this.identifier = identifier
  this.message = message
}

Log.prototype.setLocalIdentifier = function (identifier) {
  this.localIdentifier = identifier
}

Log.prototype.debug = function () {
  this._write(this._entry(Logger.Level.DEBUG, arguments))
}

Log.prototype.verbose = function () {
  this._write(this._entry(Logger.Level.VERBOSE, arguments))
}

Log.prototype.info = function () {
  this._write(this._entry(Logger.Level.INFO, arguments))
}

Log.prototype.important = function () {
  this._write(this._entry(Logger.Level.IMPORTANT, arguments))
}

Log.prototype.warn = function () {
  this._write(this._entry(Logger.Level.WARNING, arguments))
}

Log.prototype.error = function () {
  this._write(this._entry(Logger.Level.ERROR, arguments))
}

Log.prototype.fatal = function () {
  this._write(this._entry(Logger.Level.FATAL, arguments))
}

Log.prototype._entry = function (priority, args) {
  return new Log.Entry(
    new Date()
    , priority
    , this.tag
    , process.pid
    , this.localIdentifier || Logger.globalIdentifier
    , util.format.apply(util, args)
  )
}

Log.prototype._format = function (entry) {
  return util.format('%s %s/%s %d [%s] %s'
    , chalk.grey(entry.timestamp.toLocaleString())
    , this._name(entry.priority)
    , chalk.bold(entry.tag)
    , entry.pid
    , entry.identifier
    , entry.message
  )
}

Log.prototype._name = function (priority) {
  return chalk[this.styles[priority]](this.names[priority])
}

/* eslint no-console: 0 */
Log.prototype._write = function (entry) {
  console.log(this._format(entry))
  this.emit('entry', entry)
  Logger.emit('entry', entry)
}

exports = module.exports = Logger
