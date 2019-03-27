var Promise = require('bluebird')

var logger = require('../../util/logger')
var wire = require('../../wire')
var wireutil = require('../../wire/util')
var wirerouter = require('../../wire/router')
var dbapi = require('../../db/api')
var lifecycle = require('../../util/lifecycle')
var srv = require('../../util/srv')
var TtlSet = require('../../util/ttlset')
var zmqutil = require('../../util/zmqutil')
var send_email = require('../../util/send_email')
var rent_ctrl = require('../../util/rent_mobile_ctrl')

var user = require('../api/controllers/user')


module.exports = function (options) {
  var log = logger.createLogger('reaper')
  var ttlset = new TtlSet(options.heartbeatTimeout)
  var devices_off = []
  var timer = null
  var timerSynUser = null
  console.log("Starting reaper!")
  timer = setTimeout(DealEmail, 60 * 1000)

  function SynUser() {
    if (timerSynUser) {
      clearTimeout(timerSynUser)
    }
    console.log("SynUser Timer")
    user.updateAllUsersTimer()
  }

  function DealEmail() {
    console.log("Timer is out ,to loadAllDevices")
    if (timer) {
      //  console.log('Stop DealEmail Timer')
      clearTimeout(timer)
    }
    var now = new Date();
    var hh = now.getHours();            //时
    var mm = now.getMinutes();          //分
    if (hh == 23 && mm == 59) {
      timerSynUser = setTimeout(SynUser, 1000)
    }
    var AllPromises = []
    loadAllDevices().then(function (devicelist) {
      AllPromises = []
      console.log("devices count:" + devicelist.length)
      devicelist.forEach(device => {
        AllPromises.push(new Promise(function (resolve) {
          var re = calctimer(device)
          if (re > 0) {
            var subject
            if (re == 1) {
              subject = "Your rented phone:" + device.serial + " is about to expire,about 30 minutes"
            } else if (re == 2) {
              subject = "Your rented phone:" + device.serial + " has expired"
            }
            var email = new send_email(device.device_rent_conf.owner.email, device.device_rent_conf.owner.email, subject, "")
            console.log("send email:" + device.device_rent_conf.owner.email + ",mobile:" + device.serial)
            email.send().then(function (ret) {
              console.log("send,return:" + JSON.stringify(ret))
              return resolve(ret)
            })
          } else {
            return resolve('false')
          }
        }))

      });

      Promise.all(AllPromises).then(function (result) {
        //  console.log('Start DealEmail Timer')
        //  timer = setTimeout(DealEmail, 60 * 1000)
        return result
      }).finally(function (ret) {
        console.log('Start Email Timer Again :' + CurentTime())
        timer = setTimeout(DealEmail, 60 * 1000)
      })
    })
  }
  function CurentTime() {
    var now = new Date();

    var year = now.getFullYear();       //年
    var month = now.getMonth() + 1;     //月
    var day = now.getDate();            //日

    var hh = now.getHours();            //时
    var mm = now.getMinutes();          //分

    var clock = year + "-";

    if (month < 10)
      clock += "0";

    clock += month + "-";

    if (day < 10)
      clock += "0";

    clock += day + " ";

    if (hh < 10)
      clock += "0";

    clock += hh + ":";
    if (mm < 10) clock += '0';
    clock += mm;
    return (clock);
  }

  function calctimer(device) {
    if (device &&
      device.device_rent_conf &&
      device.device_rent_conf.rent &&
      device.device_rent_conf.rent_time &&
      device.device_rent_conf.start_time) {
      now = Date.now();
      target_time1_email = device.device_rent_conf.start_time +
        device.device_rent_conf.rent_time * 60 * 1000 - 30 * 60 * 1000;
      target_time1_stop_email = device.device_rent_conf.start_time +
        device.device_rent_conf.rent_time * 60 * 1000 - 28.2 * 60 * 1000;
      target_time2_stop = device.device_rent_conf.start_time +
        device.device_rent_conf.rent_time * 60 * 1000;
      target_time2_send_email = device.device_rent_conf.start_time +
        device.device_rent_conf.rent_time * 60 * 1000 - 60 * 1000;
      if (now > target_time1_email) {
        if (now < target_time1_stop_email) {
          return 1
        }
        else if (now > target_time2_stop) {
          console.log("rent is stop")
          rent_ctrl.stop(device)
          return -1
        }
        else if (now > target_time2_send_email) {
          return 2
        }
        return -1
      }
      else {
        return -1
      }
    }
    return -1
  }

  // Input
  var sub = zmqutil.socket('sub')
  Promise.map(options.endpoints.sub, function (endpoint) {
    return srv.resolve(endpoint).then(function (records) {
      return srv.attempt(records, function (record) {
        log.info('Receiving input from "%s"', record.url)
        sub.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
    .catch(function (err) {
      log.fatal('Unable to connect to sub endpoint', err)
      lifecycle.fatal()
    })

    // Establish always-on channels
    ;[wireutil.global].forEach(function (channel) {
      log.info('Subscribing to permanent channel "%s"', channel)
      sub.subscribe(channel)
    })

  // Output
  var push = zmqutil.socket('push')
  Promise.map(options.endpoints.push, function (endpoint) {
    return srv.resolve(endpoint).then(function (records) {
      return srv.attempt(records, function (record) {
        log.info('Sending output to "%s"', record.url)
        push.connect(record.url)
        return Promise.resolve(true)
      })
    })
  })
    .catch(function (err) {
      log.fatal('Unable to connect to push endpoint', err)
      lifecycle.fatal()
    })

  ttlset.on('insert', function (serial) {
    log.info('Device "%s" is present', serial)
    push.send([
      wireutil.global
      , wireutil.envelope(new wire.DevicePresentMessage(
        serial
      ))
    ])
  })

  ttlset.on('drop', function (serial) {
    log.info('Reaping device "%s" due to heartbeat timeout', serial)
    push.send([
      wireutil.global
      , wireutil.envelope(new wire.DeviceAbsentMessage(
        serial
      ))
    ])
  })

  function loadInitialState() {
    return dbapi.loadPresentDevices()
      .then(function (cursor) {
        return Promise.promisify(cursor.toArray, cursor)()
          .then(function (list) {
            var now = Date.now()
            list.forEach(function (device) {
              ttlset.bump(device.serial, now, TtlSet.SILENT)
            })
          })
      })
  }
  function loadAllDevices() {
    return dbapi.getAllDevices()
      .then(function (cursor) {
        return Promise.promisify(cursor.toArray, cursor)()
          .then(function (list) {
            var now = Date.now()
            var devices = []
            list.forEach(function (device) {
              if (device.deviceType && device.deviceType === "现场测试") {
                devices.push(device)
              }
            })
            return devices
          })
      })
  }
  function SendEmail() {

  }

  function listenToChanges() {
    sub.on('message', wirerouter()
      .on(wire.DeviceIntroductionMessage, function (channel, message) {
        ttlset.drop(message.serial, TtlSet.SILENT)
        ttlset.bump(message.serial, Date.now())
      })
      .on(wire.DeviceHeartbeatMessage, function (channel, message) {
        ttlset.bump(message.serial, Date.now())
      })
      .on(wire.DeviceAbsentMessage, function (channel, message) {
        ttlset.drop(message.serial, TtlSet.SILENT)
      })
      .handler())
  }

  log.info('Reaping devices with no heartbeat')

  lifecycle.observe(function () {
    [push, sub].forEach(function (sock) {
      try {
        sock.close()
      }
      catch (err) {
        // No-op
      }
    })

    ttlset.stop()
  })

  loadInitialState().then(listenToChanges).catch(function (err) {
    log.fatal('Unable to load initial state', err)
    lifecycle.fatal()
  })
}
