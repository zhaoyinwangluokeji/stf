var http = require('http')
var Promise = require('bluebird')
var express = require('express')
var validator = require('express-validator')
var bodyParser = require('body-parser')
var request = require('request')
var url = require('url')
var util = require('util')
var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var adbkit = require('adbkit')
var Executor = require('./compat-executor')
var dbapi = require('../../db/api')

module.exports = function(options) {
  var log = logger.createLogger('compat')
  var app = express()
  var server = http.createServer(app)
  var executor = new Executor()

  app.set('strict routing', false)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  app.use(bodyParser.json())
  app.use(validator())

  app.get('/', function (req, res) {
    res.status(200)
          .json({
            success: true
          })
  })

  function pushApp(serial, href) {
    var req = request({
      url: url.resolve(options.storageUrl, href)
    })

    // We need to catch the Content-Length on the fly or we risk
    // losing some of the initial chunks.
    var contentLength = null
    req.on('response', function(res) {
      contentLength = parseInt(res.headers['content-length'], 10)
    })

    var source = new stream.Readable().wrap(req)
    log.info('install source path: ' + JSON.stringify(source))
    var target = '/data/local/tmp/_app.apk'

    return adbkit.push(serial, source, target)
      .timeout(10000)
      .then(function(transfer) {
        var resolver = Promise.defer()

        function progressListener(stats) {
          if (contentLength) {
            // Progress 0% to 70%
            sendProgress(
              'pushing_app'
            , 50 * Math.max(0, Math.min(
                50
              , stats.bytesTransferred / contentLength
              ))
            )
          }
        }

        function errorListener(err) {
          resolver.reject(err)
        }

        function endListener() {
          resolver.resolve(target)
        }

        transfer.on('progress', progressListener)
        transfer.on('error', errorListener)
        transfer.on('end', endListener)

        return resolver.promise.finally(function() {
          transfer.removeListener('progress', progressListener)
          transfer.removeListener('error', errorListener)
          transfer.removeListener('end', endListener)
        })
      })
  }

  app.post('/c/compat/install', function(req, res) {
    
    requtil.validate(req, function() {
        req.checkBody('id').notEmpty()
        req.checkBody('serials').notEmpty()
        req.checkBody('package').notEmpty()
        req.checkBody('activity').notEmpty()
        req.checkBody('version').notEmpty()
        req.checkBody('uninstall').notEmpty()
        req.checkBody('user').notEmpty()
      })
      .then(function() {
        log.info('Got Compat: ' + JSON.stringify(req.body))
        var serials = req.body.serials
        var deviceNum = serials.length
        log.info('device number: ' + deviceNum)
        var package = req.body.package
        var activity = req.body.activity
        var id = req.body.id
        var version = req.body.version
        var uninstall = req.body.uninstall
        var user = req.body.user
        var path = ''
        var href = req.body.href
        log.info('storageUrl: ' + options.storageUrl)

        request(url.resolve(options.storageUrl, util.format(
          '/s/path/%s'
        , req.body.id
        )), function (error, response, body) {
          log.info('got code: ' + response.statusCode)
          if(error){
            log.error('error code: '+response.statusCode)
          }
          if (!error && response.statusCode == 200) {
            log.info('got body: '+ JSON.stringify(body))
            path = JSON.parse(body).path
          }

          if (path != '') {
            log.info("filepath:"+path)

            var process = require('child_process');
            process.exec('mv ' + path + ' ' + path + '.apk',function (error, stdout, stderr) {
              if (error !== null) {
                log.error('exec error: ' + error);
              }else{
                var randomID = 'd' + Math.floor(Math.random() * 1000000)
                dbapi.addCompatResult(randomID,'Android',[],package,activity,version,'started',serials.length,user,uninstall)
                .then(function(){
                  serials.forEach(serial => {
                    log.info('installing apk: ' + path+'.apk in device: ' + serial)
                    return executor.execute(randomID,path,serial, package, activity,uninstall)
                  });
                })
              }
             });

  
            res.status(201)
            .json({
              success: true
            , resource: {
                date: new Date()
              , type: 'install'
              , serials: serials
              , id: id
              , package: package
              , activity: activity
              , path: path
              }
            })
  
          }
          else {
            res.sendStatus(404)
          }

        })
        
        
      })
      .catch(requtil.ValidationError, function(err) {
        res.status(400)
          .json({
            success: false
          , error: 'ValidationError'
          , validationErrors: err.errors
          })
      })
      .catch(function(err) {
        log.error('Error storing resource', err.stack)
        res.status(500)
          .json({
            success: false
          , error: 'ServerError'
          })
      })
  })

  server.listen(options.port)
  log.info('Compat Listening on port %d', options.port)
}
