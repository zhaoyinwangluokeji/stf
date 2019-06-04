var deviceData = require('stf-device-db')
var browserData = require('stf-browser-db')

var logger = require('./logger')
var path = require("path")
var log = logger.createLogger('util:datautil')

var imagesfileutil = require('../util/imagefileutil')

var datautil = module.exports = Object.create(null)

datautil.applyData = function (device) {
  return new Promise(function (resolve, reject) {
    if (!device.model || device.model.trim() == "") {
      resolve(device)
    }
    var match = deviceData.find({
      model: device.model
      , name: device.product
    })
    if (match) {
      if (match.name)
        device.name = match.name.id
      if (match.date)
        device.releasedAt = match.date
      if (match.image)
        device.image = match.image
      if (match.cpu)
        device.cpu = match.cpu
      if (match.memory)
        device.memory = match.memory
      if (match.display && match.display.s) {
        device.display = device.display || {}
        device.display.inches = match.display.s
      }
      return resolve(device)
    } else {
      var fpath = path.join('app', 'components', 'mobile-images')
      var file = device.model.replace(/ /g, '_').replace(/[+]/g, '_').trim()
      imagesfileutil.findimage(fpath, file).then(function (res) {
        if (!!res) {
          device.image = path.join('mobile-images', res)
          return resolve(device)
        }
        else {
          return resolve(device)
        }
      })
    }
  })
}

datautil.applyBrowsers = function (device) {
  if (device.browser) {
    device.browser.apps.forEach(function (app) {
      var data = browserData[app.type]
      if (data) {
        app.developer = data.developer
      }
    })
  }
  return device
}

datautil.applyOwner = function (device, user) {
  device.using = !!device.owner && device.owner.email === user.email
  return device
}

// Only owner can see this information
datautil.applyOwnerOnlyInfo = function (device, user) {
  if (device.owner && device.owner.email === user.email) {
    // No-op
  }
  else {
    device.remoteConnect = false
    device.remoteConnectUrl = null
  }
}

datautil.normalize = function (device, user) {
  return datautil.applyData(device).then(function (dev) {
    datautil.applyBrowsers(device)
    datautil.applyOwner(device, user)
    datautil.applyOwnerOnlyInfo(device, user)
    if (!device.present) {
      //  device.owner = null
    }
    return device
  })

}
