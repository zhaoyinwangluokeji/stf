
var Promise = require('bluebird')
var syrup = require('stf-syrup')
var url = require('url')
var util = require('util')
var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var logger = require('../..//util/logger')
var adbkit = require('adbkit')
var dbapi = require('../../db/api')

function InstallationError(err) {
  return err.code && /^INSTALL_/.test(err.code)
}

module.exports = function () {
  var log = logger.createLogger('compat-executor')
  var adb = adbkit.createClient({
    host: '127.0.0.1'
    , port: 5037
  })

  function updateResultToDb(id, resultData) {
    if (resultData == null) {
      var complete = false
      var passed = false
    } else if (resultData.currentState == 'failed') {
      var complete = true
      var passed = false
    } else if (resultData.currentState == 'finished') {
      var complete = true
      var passed = true
    } else {
      var complete = false
      var passed = false
    }
    dbapi.getCompatResultById(id)
      .then(function (result) {
        if (complete) {
          result.finished = result.finished + 1
        }
        if (passed) {
          result.passed = result.passed + 1
        }
        if (result.finished == result.taskNum) {
          result.state = 'finished'
        }
        log.info('result: ' + JSON.stringify(result))
        var currentData = result.data
        if (resultData == null) {
          return dbapi.updateCompatResult(id, currentData, result.finished, result.state, result.passed)
        }
        var len = currentData.length
        var newData = []
        if (len == 0) {
          newData.push(resultData)
        } else {
          var find = false
          for (var i = 0; i < len; i++) {
            if (currentData[i].serial == resultData.serial) {
              currentData[i] = resultData
              find = true
              break
            }
          }
          if (!find) {
            currentData.push(resultData)
          }
          newData = currentData
        }
        return dbapi.updateCompatResult(id, newData, result.finished, result.state, result.passed)
      })
  }

  function writeInstallResult(id, serial, manufacturer, model, platformVersion, installResult, installErrorMsg, launchResult, launchTime, currentState, installTime, hotLuanchTime = null, launchErrorMsg = '') {
    var resultData = {
      serial: serial,
      manufacturer: manufacturer,
      model: model,
      platformVersion: platformVersion,
      installResult: installResult,
      installErrorMsg: installErrorMsg,
      launchResult: launchResult,
      launchTime: launchTime,
      currentState: currentState,
      installTime: installTime,
      hotLuanchTime: hotLuanchTime,
      launchErrorMsg: launchErrorMsg,
    }
    return updateResultToDb(id, resultData)
  }

  function unstr(ifUninstall, serial, manufacturer, model, platformVersion, package, id) {
    if (ifUninstall) {
      return adb.uninstall(serial, package)
        .catch(Promise.TimeoutError, function (err) {
          log.error('uninstall of package "%s" failed', package, err.stack)
          writeInstallResult(id, serial, manufacturer, model, platformVersion, 'fail', 'timeout', null, null, 'failed', null)
          return new Promise(function (resolve) { return resolve(false) })
        })
        .catch(InstallationError, function (err) {
          log.important(
            'Tried to uninstall package "%s", got "%s"'
            , package
            , err.code
          )
          writeInstallResult(id, serial, manufacturer, model, platformVersion, 'fail', err.message, null, null, 'failed', null)
          return new Promise(function (resolve) { return resolve(false) })
        })
        .catch(function (err) {
          log.error('uninstall of package "%s" failed: ', package, err.stack)
          writeInstallResult(id, serial, manufacturer, model, platformVersion, 'fail', err.message, null, null, 'failed', null)
          return new Promise(function (resolve) { return resolve(false) })
        })
    } else {
      return new Promise(function (resolve) { return resolve(true) })
    }
  }

  this.execute = function (id, apkPath, serial, package, activity, ifUninstall) {
    dbapi.loadDevice(serial)
    .then(function(device){
      var manufacturer = device.manufacturer
      var model = device.model
      var platformVersion = device.version
      console.log('got device : ' + JSON.stringify(device))
  
  
      unstr(ifUninstall, serial, manufacturer, model, platformVersion, package, id).then(function (uninstallSuccess) {
        log.info('uninstall result: ' + uninstallSuccess)
        if (!uninstallSuccess) {
          return new Promise(function (resolve) { return resolve(false) })
        }
        var time1 = new Date()
        adb.install(serial, apkPath + '.apk')
          .then(function (trunk) {
            log.info('install result: ' + trunk)
            if (trunk) {
              var time2 = new Date()
              var installTime = (time2 - time1) / 1000
              writeInstallResult(id, serial, manufacturer, model, platformVersion, 'success', null, null, null, 'installed', installTime)

            } else {
              writeInstallResult(id, serial, manufacturer, model, platformVersion, 'fail', 'unknown', null, null, 'failed', null)
              return
            }
            if (activity.indexOf('.') === -1) {
              activity = util.format('.%s', activity)
            }
  
            var launchActivity = {
              action: 'android.intent.action.MAIN'
              , component: util.format(
                '%s/%s'
                , package
                , activity
              )
              , category: ['android.intent.category.LAUNCHER']
              , flags: 0x10200000
            }
  
            log.info(
              'Launching activity with action "%s" on component "%s"'
              , launchActivity.action
              , launchActivity.component
            )
            var launchTime = 'unknown'
            executeShellAndGetResult(serial, 'am start -W ' + launchActivity.component)
              .then(function (result) {
                var tmpD = result.data
                if(result.data.indexOf('Error:') != -1){
                  tmpD = result.data.split('Error:')[1]
                }
                if (result.result == 'fail') {
                  writeInstallResult(id, serial, manufacturer, model, platformVersion, 'success', null, 'fail', 'unknown', 'failed', installTime, 'unknown',tmpD)
                  return resolver.resolve()
                }
                var tmpResult = result.data.split('\n')
                for (i = 0; i < tmpResult.length; i++) {
                  if (tmpResult[i].indexOf('TotalTime') != -1) {
                    var tmp = tmpResult[i].split(':');
                    console.log("总启动时间:" + tmpResult[i]);
                    launchTime = tmp[1].trim();
                  }
                }
                
                log.info('start activity result: ' + tmpD)
                if (launchTime == 'unknown') {
                  return writeInstallResult(id, serial, manufacturer, model, platformVersion, 'success', null, 'fail', 'unknown', 'failed', installTime, 'unknown',tmpD)
                } else {
                  return writeInstallResult(id, serial, manufacturer, model, platformVersion, 'success', null, 'success', launchTime, 'launched', installTime)
                }
              })
              .then(function () {
                if (launchTime == 'unknown') {
                  return new Promise(function (resolve) { return resolve(false) })
                }
                adb.shell(serial, 'input keyevent 3')
                  .then(function () {
                    var resolver = Promise.defer()
                    setTimeout(() => {
                      console.log('sleep 2 s...')
                      executeShellAndGetResult(serial, 'am start -W ' + launchActivity.component)
                        .then(function (result) {
                          var hotLaunchTime = 'unknown'
                          var tmpD = result.data
                          if(result.data.indexOf('Error:') != -1){
                            tmpD = result.data.split('Error:')[1]
                          }
                          if (result.result == 'fail') {
                            writeInstallResult(id, serial, manufacturer, model, platformVersion, 'success', null, 'fail', launchTime, 'failed', installTime, 'unknown',tmpD)
                            return resolver.resolve()
                          }
                          var tmpResult = result.data.split('\n')
                          for (i = 0; i < tmpResult.length; i++) {
                            if (tmpResult[i].indexOf('TotalTime') != -1) {
                              var tmp = tmpResult[i].split(':');
                              console.log("总启动时间:" + tmpResult[i]);
                              hotLaunchTime = tmp[1].trim();
                            }
                          }
                          log.info('hot start activity result: ' + tmpD)
                          if (hotLaunchTime == 'unknown') {
                            return writeInstallResult(id, serial, manufacturer, model, platformVersion, 'success', null, 'fail', launchTime, 'failed', installTime, hotLaunchTime, tmpD)
                          } else {
                            return writeInstallResult(id, serial, manufacturer, model, platformVersion, 'success', null, 'success', launchTime, 'finished', installTime, hotLaunchTime)
                          }
                        })
                    }, 2000);
                  })
              })
          })
          .catch(Promise.TimeoutError, function (err) {
            log.error('Installation of package "%s" failed', package, err.stack)
            writeInstallResult(id, serial, manufacturer, model, platformVersion, 'fail', 'timeout', null, null, 'failed', installTime)
  
          })
          .catch(InstallationError, function (err) {
            log.important(
              'Tried to install package "%s", got "%s"'
              , package
              , err.code
            )
            writeInstallResult(id, serial, manufacturer, model, platformVersion, 'fail', err.message, null, null, 'failed', installTime)
          })
          .catch(function (err) {
            log.error('Installation of package "%s" failed: ', package, err.stack)
            writeInstallResult(id, serial, manufacturer, model, platformVersion, 'fail', err.message, null, null, 'failed', installTime)
          })
      })
    })
    
  }


  function executeShellAndGetResult(serial, command) {
    return adb.shell(serial, command)
      .timeout(30000)
      .then(function (stream) {
        var result = ''
        var resolver = Promise.defer()
        var timer

        function forceStop() {
          stream.end()
        }

        function readableListener() {
          var chunk
          while ((chunk = stream.read())) {
            result += chunk
          }
        }

        function endListener() {
          var tmpResult = {
            result: 'success',
            data: result
          }

          return resolver.resolve(tmpResult)
        }

        function errorListener(err) {
          log.error('shell command failed', message.command, err.stack)
          tmpResult = {
            result: 'fail',
            data: err.message
          }
          return resolver.resolve(tmpResult)
        }

        stream.setEncoding('utf8')

        stream.on('readable', readableListener)
        stream.on('end', endListener)
        stream.on('error', errorListener)

        timer = setTimeout(forceStop, 10000)

        return resolver.promise.finally(function () {
          stream.removeListener('readable', readableListener)
          stream.removeListener('end', endListener)
          stream.removeListener('error', errorListener)
          clearTimeout(timer)
        })
      })
      .error(function (err) {
        log.error('shell command failed', err.stack)
        tmpResult = {
          result: 'fail',
          data: err.message
        }
        var resolver = Promise.defer()
        return resolver.resolve(tmpResult)
      })
  }


}
