var _ = require('lodash')
var Promise = require('bluebird')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')

var log = logger.createLogger('api:controllers:devices')

module.exports = {
  getDevices: getDevices
  , getDeviceBySerial: getDeviceBySerial
}

function getDevices(req, res) {
  var fields = req.swagger.params.fields.value
  dbapi.loadDevices()
    .then(function (cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function (list) {
          var deviceList = []
          var promiselist = []
          var i=0;
          list.forEach(function (device) {
            promiselist.push(
              new Promise(function (resolve, reject) {
                datautil.normalize(device, req.user).then(function (d) {
                  var responseDevice = device
                  if (fields) {
                    responseDevice = _.pick(device, fields.split(','))
                  }
                  deviceList.push(responseDevice)
                  return  resolve(responseDevice)
                })
              })
            )
          })
          Promise.all(promiselist).then(function(result){
            res.json({
              success: true
              , devices: deviceList
            })
          })

        })
    })
    .catch(function (err) {
      log.error('Failed to load device list: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value
  var fields = req.swagger.params.fields.value

  dbapi.loadDevice(serial)
    .then(function (device) {
      if (!device) {
        return res.status(404).json({
          success: false
          , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user).then(function(result){
        var responseDevice = device
        if (fields) {
          responseDevice = _.pick(device, fields.split(','))
        }
        res.json({
          success: true
          , device: responseDevice
        })
      })

    })
    .catch(function (err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}
