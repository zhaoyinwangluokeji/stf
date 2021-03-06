var http = require('http')
var events = require('events')
var util = require('util')

var socketio = require('socket.io')
var Promise = require('bluebird')
var _ = require('lodash')
var request = Promise.promisifyAll(require('request'))
var adbkit = require('adbkit')
var uuid = require('uuid')

var logger = require('../../util/logger')
var wire = require('../../wire')
var wireutil = require('../../wire/util')
var wirerouter = require('../../wire/router')
var dbapi = require('../../db/api')
var datautil = require('../../util/datautil')
var srv = require('../../util/srv')
var lifecycle = require('../../util/lifecycle')
var zmqutil = require('../../util/zmqutil')
var cookieSession = require('./middleware/cookie-session')
var ip = require('./middleware/remote-ip')
var auth = require('./middleware/auth')
var jwtutil = require('../../util/jwtutil')
var rent_mobile_ctrl = require('../../util/rent_mobile_ctrl')


var permission = require('../../util/permission')


module.exports = function (options) {
  var log = logger.createLogger('websocket')
  var server = http.createServer()
  var io = socketio.listen(server, {
    serveClient: false
    , transports: ['websocket']
  })
  var channelRouter = new events.EventEmitter()

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

  sub.on('message', function (channel, data) {
    //log.info("message:"+channel)
    channelRouter.emit(channel.toString(), channel, data)
  })

  io.use(cookieSession({
    name: options.ssid
    , keys: [options.secret]
  }))

  io.use(ip({
    trust: function () {
      return true
    }
  }))

  io.use(auth)

  io.on('connection', function (socket) {
    var req = socket.request
    var user = req.user
    var channels = []

    var permissions = {}
    permission.getpermission(user).then(function (result) {
      permissions = result
    })


    user.ip = socket.handshake.query.uip || req.ip
    socket.emit('socket.ip', user.ip)

    function joinChannel(channel) {
      channels.push(channel)
      channelRouter.on(channel, messageListener)
      sub.subscribe(channel)
    }

    function leaveChannel(channel) {
      _.pull(channels, channel)
      channelRouter.removeListener(channel, messageListener)
      sub.unsubscribe(channel)
    }

    function createKeyHandler(Klass) {
      return function (channel, data) {
        push.send([
          channel
          , wireutil.envelope(new Klass(
            data.key
          ))
        ])
      }
    }

    var messageListener = wirerouter()
      .on(wire.DeviceLogMessage, function (channel, message) {
        socket.emit('device.log', message)
      })
      .on(wire.DeviceIntroductionMessage, function (channel, message) {
        console.log("wire.DeviceIntroductionMessage")
        socket.emit('device.add', {
          important: true
          , data: {
            serial: message.serial
            , present: false
            , provider: message.provider
            , owner: null
            , status: message.status
            , ready: false
            , reverseForwards: []
          }
        })
      })
      .on(wire.DeviceReadyMessage, function (channel, message) {
        console.log("wire.DeviceReadyMessage")
        socket.emit('device.change', {
          important: true
          , data: {
            serial: message.serial
            , channel: message.channel
            , owner: null // @todo Get rid of need to reset this here.
            , ready: true
            , reverseForwards: [] // @todo Get rid of need to reset this here.
          }
        })
      })
      .on(wire.DevicePresentMessage, function (channel, message) {
        console.log("wire.DevicePresentMessage")
        socket.emit('device.change', {
          important: true
          , data: {
            serial: message.serial
            , present: true
          }
        })
      })
      .on(wire.DeviceAbsentMessage, function (channel, message) {
        console.log("wire.DeviceAbsentMessage")
        socket.emit('device.remove', {
          important: true
          , data: {
            serial: message.serial
            , present: false
            , likelyLeaveReason: 'device_absent'
          }
        })
      })
      .on(wire.JoinGroupMessage, function (channel, message) {
        console.log("wire.JoinGroupMessage:channel:" + channel)
        console.log("message:" + JSON.stringify(message))
        return  dbapi.loadDevice(message.serial).then(
          function (device) {
            var rentId = device.device_rent_conf.rentId
            var uslog = {
              "using_time_start": Date.now(),
              "using_time": 0
            }
            console.log("write log:" + JSON.stringify(uslog))
            console.log("rentId:" + rentId)
            return  dbapi.saveDeviceUsingLog(rentId, uslog)
          }
        ).finally(function (r) {
          return  socket.emit('device.change', {
            important: true
            , data: datautil.applyOwner({
              serial: message.serial
              , owner: message.owner
              , likelyLeaveReason: 'owner_change'
              , usage: message.usage
            }
              , user
            )
          })
        })

      })
      .on(wire.JoinGroupByAdbFingerprintMessage, function (channel, message) {
        console.log("wire.JoinGroupByAdbFingerprintMessage,title:" + JSON.stringify(message))
     /*     socket.emit('user.keys.adb.confirm', {
            title: message.comment
            , fingerprint: message.fingerprint
          })*/
        return dbapi.dumpsUsersAdbKey(message.fingerprint)
          .then(function (users) {
            return dbapi.insertUserAdbKey(user.email, {
              title: message.comment
              , fingerprint: message.fingerprint
            })
          })
          .then(function () {
            push.send([
              user.group
              , wireutil.envelope(new wire.AdbKeysUpdatedMessage())
            ])
          })
          .catch(dbapi.DuplicateSecondaryIndexError, function (err) {
            // No-op
            console.log("dbapi.DuplicateSecondaryIndexError:" + err)
          })

      })
      .on(wire.LeaveGroupMessage, function (channel, message) {
        console.log("wire.LeaveGroupMessage")
        var dev
        return  dbapi.loadDevice(message.serial).then(
          function (device) {
            dev = device
            var rentId = device.device_rent_conf.rentId
            return rent_mobile_ctrl.stop(device).then(function () {
              return dbapi.getDeviceUsingLog(rentId).then(function (ret) {
                if (ret && ret.using_time_start) {
                  var time = Date.now() - ret.using_time_start;
                  var t2 = Math.round((time % (1000 * 3600)) / (1000 * 60.0));
                  console.log("using time:" + t2);
                  var uslog = {
                    using_time: t2
                  }
                  console.log("write exit log:" + JSON.stringify(uslog))
                  dbapi.saveDeviceUsingLog(rentId, uslog)
                }
              })
            })
          }
        ).finally(function (ret) {
          console.log("finally LeaveGroupMessage");
          dev.owner = null
          dev.likelyLeaveReason = message.reason
          socket.emit('device.change', {
            important: true
            , data: datautil.applyOwner({
              serial: message.serial
              , owner: null
              , likelyLeaveReason: message.reason
            }
              , user
            )
          })

          dbapi.loadDevice(message.serial).then(function (result) {
            console.log("Leave 1 device.change")
            io.emit('device.change', {
              important: true
              , data: {
                serial: result.serial
                , notes: result.notes
                , device_rent_conf: result.device_rent_conf
                , owner: null
              }
            })
          })
        })

      })
      .on(wire.DeviceStatusMessage, function (channel, message) {
        message.likelyLeaveReason = 'status_change'
        socket.emit('device.change', {
          important: true
          , data: message
        })
      })
      .on(wire.DeviceIdentityMessage, function (channel, message) {
        datautil.applyData(message).then(function (dev) {
          socket.emit('device.change', {
            important: true
            , data: message
          })
        })
      })
      .on(wire.TransactionProgressMessage, function (channel, message) {
        socket.emit('tx.progress', channel.toString(), message)
      })
      .on(wire.TransactionDoneMessage, function (channel, message) {
        socket.emit('tx.done', channel.toString(), message)
      })
      .on(wire.DeviceLogcatEntryMessage, function (channel, message) {
        socket.emit('logcat.entry', message)
      })
      .on(wire.AirplaneModeEvent, function (channel, message) {
        socket.emit('device.change', {
          important: true
          , data: {
            serial: message.serial
            , airplaneMode: message.enabled
          }
        })
      })
      .on(wire.BatteryEvent, function (channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: false
          , data: {
            serial: serial
            , battery: message
          }
        })
      })
      .on(wire.DeviceBrowserMessage, function (channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: true
          , data: datautil.applyBrowsers({
            serial: serial
            , browser: message
          })
        })
      })
      .on(wire.ConnectivityEvent, function (channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: false
          , data: {
            serial: serial
            , network: message
          }
        })
      })
      .on(wire.PhoneStateEvent, function (channel, message) {
        var serial = message.serial
        delete message.serial
        socket.emit('device.change', {
          important: false
          , data: {
            serial: serial
            , network: message
          }
        })
      })
      .on(wire.RotationEvent, function (channel, message) {
        socket.emit('device.change', {
          important: false
          , data: {
            serial: message.serial
            , display: {
              rotation: message.rotation
            }
          }
        })
      })
      .on(wire.ReverseForwardsEvent, function (channel, message) {
        socket.emit('device.change', {
          important: false
          , data: {
            serial: message.serial
            , reverseForwards: message.forwards
          }
        })
      })
      .on(wire.DeviceRentMessage, function (channel, message) {
        console.log("web DeviceRentMessage:" + JSON.stringify(message))
        socket.emit('device.change', {
          important: false
          , data: {
            serial: message.serial
            , device_rent_conf: message
          }
        })
      })
      .handler()

    // Global messages
    //
    // @todo Use socket.io to push global events to all clients instead
    // of listening on every connection, otherwise we're very likely to
    // hit EventEmitter's leak complaints (plus it's more work)
    channelRouter.on(wireutil.global, messageListener)

    // User's private group
    joinChannel(user.group)

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


    new Promise(function (resolve) {
      socket.on('disconnect', resolve)
        // Global messages for all clients using socket.io
        //
        // Device note
        .on('device.note', function (data) {
          return dbapi.setDeviceNote(data.serial, data.note)
            .then(function () {
              return dbapi.loadDevice(data.serial)
            })
            .then(function (device) {
              if (device) {
                io.emit('device.change', {
                  important: true
                  , data: {
                    serial: device.serial
                    , notes: device.notes
                  }
                })
              }
            })
        })
        .on('device.maintain', function (data) {
          return dbapi.setDeviceMaintain(data.serial, data.maintain)
            .then(function () {
              return dbapi.loadDevice(data.serial)
            })
            .then(function (device) {
              if (device) {
                io.emit('device.change', {
                  important: true
                  , data: {
                    serial: device.serial
                    , maintain: device.maintain
                  }
                })
              }
            })
        })
        .on('device.rent_conf.set', function (channel, responseChannel, data) {
          try {
            console.log("channel:" + JSON.stringify(channel) + ",reschannel:" + responseChannel)
            var device
            if (!data.serial) {
              socket.emit('tx.done', responseChannel.toString(), new wire.TransactionDoneMessage(
                "N8K7N17206007791"
                , 0
                , false
                , "ValidationDataError data.serial:null'"
                , null
              ))
              return
            }
            return  dbapi.loadDevice(data.serial).then(function (dev) {
              device = dev
              var errormessage = ""
              if (!device) {
                errormessage = "手机不存在，序列号：" + data.serial
              }
              else if (device.device_rent_conf && device.device_rent_conf.rent == true && data.device_rent_conf.rent == true) {
                errormessage = '手机已经被:' + (device.device_rent_conf.owner ? (device.device_rent_conf.owner.NameCN || device.device_rent_conf.owner.name) : "NoOwner") + " 租用"
              } else if (device.device_rent_conf && device.device_rent_conf.rent == true && data.device_rent_conf.rent == false) {
                if (device.owner && data.device_rent_conf && data.device_rent_conf.owner) {
                  if (!permissions.is_adminstrator && device.owner.name != data.device_rent_conf.owner.name) {
                    errormessage = "你不能释放别人租用的手机：" + data.serial
                  }
                }
              }
              if (errormessage != "") {
                console.log(errormessage)
                socket.emit('tx.done', responseChannel.toString(), new wire.TransactionDoneMessage(
                  channel
                  , 0
                  , false
                  , errormessage
                  , null
                ))
                return
              }
              var rentId = util.format('%s-%s', uuid.v4(), uuid.v4()).replace(/-/g, '')
              if (data.device_rent_conf.rent == false) {
                if (data.device_rent_conf.rentId) {
                  rentId = data.device_rent_conf.rentId;
                } else {
                  data.device_rent_conf.rentId = rentId;
                }
              } else {
                data.device_rent_conf.rentId = rentId;
                data.device_rent_conf.start_time = Date.now()
              }

              data.device_rent_conf.now = Date.now()
              data.rentId = rentId;
              console.log("set device rent conf:" + data.serial + ":" + JSON.stringify(data.device_rent_conf))
              var owner
              if (data.device_rent_conf.rent) {
                owner = data.device_rent_conf.owner
              } else {
                owner = null
              }
              return dbapi.setDeviceRentConf(data.serial, data.device_rent_conf)

                .then(function () {
                  console.log("rentowner1:" + JSON.stringify(owner))
                  dbapi.setDeviceOwner(data.serial, owner).then(function () {
                    return dbapi.loadDevice(data.serial)
                  }).then(function (dev) {
                    device = dev
                    return socket.emit('tx.done', responseChannel.toString(), new wire.TransactionDoneMessage(
                      channel
                      , 0
                      , true
                      , 'Success'
                      , null
                    ))
                  }).then(function (dev) {
                    if (device) {
                      console.log("send device.change")
                      io.emit('device.change', {
                        important: true
                        , data: {
                          serial: device.serial
                          , notes: device.notes
                          , device_rent_conf: data.device_rent_conf
                          , owner: owner
                        }
                      })
                      push.send([
                        device.channel
                        , wireutil.envelope(new wire.DeviceRentMessage(
                          device.serial,
                          data.device_rent_conf.rent,
                          data.device_rent_conf.rent_time,
                          Date.now()
                        ))
                      ])
                    }
                    return device
                  })
                    .then(function (device) {
                      var rentId = device.device_rent_conf.rentId
                      var time = Date.now() - device.device_rent_conf.start_time;
                      console.log("start:" + device.device_rent_conf.start_time);
                      console.log("now:" + Date.now());
                      console.log("1now2:" + device.device_rent_conf.now);
                      console.log("time:" + time);
                      var t2 = Math.round((time % (1000 * 3600)) / (1000 * 60.0));
                      var datenow = new Date();
                      if (device.device_rent_conf.rent == false) {
                        datenow = new Date(device.device_rent_conf.start_time)
                      }
                      var curtime = datenow.Format("yyyy-MM-dd HH:mm:ss");

                      var logconf = {
                        serial: device.serial,
                        rentId: rentId,
                        manufacturer: device.manufacturer,
                        model: device.model,
                        platform: device.platform,
                        version: device.version,
                        CurrentTime: curtime,
                        test_centerCode: device.productNo ? device.productNo : "---",
                        mac_address: "---",
                        device_type: '---',
                        rent_time: device.device_rent_conf.rent_time,
                        start_time: device.device_rent_conf.start_time,
                        real_rent_time: t2,
                        owner_email: device.device_rent_conf.owner.email,
                        owner_name: device.device_rent_conf.owner.name + '\\' + device.device_rent_conf.owner.NameCN,
                        owner_group: device.device_rent_conf.owner.group,
                        ProjectCode: device.device_rent_conf.project.ProjectCode,
                        ProjectName: device.device_rent_conf.project.ProjectName

                      };
                      if (device.deviceType == "现场测试") {
                        time = Date.now() - device.device_rent_conf.start_time;
                        if (data.device_rent_conf.rent == true) {
                          logconf.using_time_start = device.device_rent_conf.start_time;
                        } else {
                          var t3 = Math.round((time % (1000 * 3600)) / (1000 * 60.0));
                          logconf.using_time = t3
                        }
                      }
                      //  console.log("config:" + JSON.stringify(logconf));
                      return dbapi.saveDeviceUsingLog(rentId, logconf)
                    }).then(function (ret) {

                    })

                })
            })
          } catch (err) {
            console.log(err.stack)
            log.error("device.rent_conf.set Error:" + err.stack)
          }

        })
        .on('device.admin_rent_conf.set', function (data) {
          console.log("device.admin_rent_conf.set")
          var rentId = util.format('%s-%s', uuid.v4(), uuid.v4()).replace(/-/g, '')
          if (data.device_rent_conf.rent == false) {
            if (data.device_rent_conf.rentId) {
              rentId = data.device_rent_conf.rentId;
            } else {
              data.device_rent_conf.rentId = rentId;
            }
          } else {
            data.device_rent_conf.rentId = rentId;
            data.device_rent_conf.start_time = Date.now()
          }

          data.device_rent_conf.now = Date.now()
          data.rentId = rentId;
          console.log("admin_rent_conf set device rent conf by admin:" + data.serial + ":" + JSON.stringify(data.device_rent_conf))
          var owner
          if (data.device_rent_conf.rent) {
            owner = data.device_rent_conf.owner
          } else {
            owner = null
          }
          //  console.log("device_rent_conf:" + JSON.stringify(data.device_rent_conf))
          return dbapi.setDeviceRentConfByAdmin(data.serial, data.device_rent_conf)

            .then(function () {
              console.log("rentowner2:" + JSON.stringify(owner))
              dbapi.setDeviceOwner(data.serial, owner).then(function () {
                return dbapi.loadDevice(data.serial)
              }).then(function (device) {
                if (device) {
                  var back = (data.device_rent_conf.rent == true) ? 0 : 1
                  console.log("send device.change:back:" + back)
                  io.emit('device.change', {
                    important: true
                    , data: {
                      serial: device.serial
                      , notes: device.notes
                      , device_rent_conf: data.device_rent_conf
                      , owner: owner
                      , back: back
                    }

                  })
                  //    console.log("rent:" + device.device_rent_conf.rent)
                  //    console.log("rent_time:" + device.device_rent_conf.rent_time)
                  push.send([
                    device.channel
                    , wireutil.envelope(new wire.DeviceRentMessage(
                      device.serial,
                      device.device_rent_conf.rent,
                      ((!!device.device_rent_conf.rent_time) ? device.device_rent_conf.rent_time : 0),
                      Date.now()
                    ))
                  ])
                }
                return device
              })
                .then(function (device) {
                  var rentId = device.device_rent_conf.rentId
                  var time = Date.now() - device.device_rent_conf.start_time;
                  console.log("start:" + device.device_rent_conf.start_time);
                  console.log("now:" + Date.now());
                  console.log("1now2:" + device.device_rent_conf.now);
                  console.log("time:" + time);
                  var t2 = Math.round((time % (1000 * 3600)) / (1000 * 60.0));
                  var datenow = new Date();
                  if (device.device_rent_conf.rent == false) {
                    datenow = new Date(device.device_rent_conf.start_time)
                  }
                  var curtime = datenow.Format("yyyy-MM-dd HH:mm:ss");

                  console.log("using time:" + t2);

                  var logconf = {
                    serial: device.serial,
                    rentId: rentId,
                    manufacturer: device.manufacturer,
                    model: device.model,
                    platform: device.platform,
                    version: device.version,
                    CurrentTime: curtime,
                    test_centerCode: device.productNo ? device.productNo : "---",
                    mac_address: "---",
                    device_type: '---',
                    rent_time: device.device_rent_conf.rent_time ? device.device_rent_conf.rent_time : 0,
                    start_time: device.device_rent_conf.start_time ? device.device_rent_conf.start_time : Date.now(),
                    real_rent_time: (!!t2) ? t2 : 0,
                    owner_email: ((device.device_rent_conf.owner && device.device_rent_conf.owner.email) ? device.device_rent_conf.owner.email : ''),
                    owner_name: device.device_rent_conf.owner ? (device.device_rent_conf.owner.name + '\\' + device.device_rent_conf.owner.NameCN) : '',
                    owner_group: device.device_rent_conf.owner ? device.device_rent_conf.owner.group : '',
                    ProjectCode: device.device_rent_conf.project ? device.device_rent_conf.project.ProjectCode : '',
                    ProjectName: device.device_rent_conf.project ? device.device_rent_conf.project.ProjectName : ''

                  };

                  if (device.deviceType == "现场测试") {

                    if (data.device_rent_conf.rent == true) {
                      logconf.using_time_start = device.device_rent_conf.start_time;
                    } else {
                      var tim = Date.now() - device.device_rent_conf.start_time;
                      var t3 = Math.round((tim % (1000 * 3600)) / (1000 * 60.0));
                      logconf.using_time = (!!t3) ? t3 : 0
                    }
                  }
                  //  console.log("config:" + JSON.stringify(logconf));
                  return dbapi.saveDeviceUsingLog(rentId, logconf)
                })

            })

        })
        .on('device.user_rent_conf.set', function (channel, responseChannel, data) {

          try {
            console.log("user_rent_conf channel:" + JSON.stringify(channel) + ",reschannel:" + responseChannel)
            var device
            if (!data.serial) {
              socket.emit('tx.done', responseChannel.toString(), new wire.TransactionDoneMessage(
                "N8K7N17206007791"
                , 0
                , false
                , "ValidationDataError data.serial:null'"
                , null
              ))
              return
            }
            dbapi.loadDevice(data.serial).then(function (dev) {
              device = dev
              var errormessage = ""
              if (!device) {
                errormessage = "手机不存在，序列号：" + data.serial
              }
              else if (device.device_rent_conf && device.device_rent_conf.rent == true && data.device_rent_conf.rent == true) {
                errormessage = '手机已经被:' + (device.device_rent_conf.owner ? (device.device_rent_conf.owner.NameCN || device.device_rent_conf.owner.name) : "NoOwner") + " 租用"
              } else if (device.device_rent_conf && device.device_rent_conf.rent == true && data.device_rent_conf.rent == false) {
                if (device.owner && data.device_rent_conf && data.device_rent_conf.owner) {
                  if (!permissions.is_adminstrator && device.owner.name != data.device_rent_conf.owner.name) {
                    errormessage = "你不能释放别人租用的手机：" + data.serial
                  }
                }
              }
              if (errormessage != "") {
                console.log(errormessage)
                socket.emit('tx.done', responseChannel.toString(), new wire.TransactionDoneMessage(
                  channel
                  , 0
                  , false
                  , errormessage
                  , null
                ))
                return
              }

              var rentId = util.format('%s-%s', uuid.v4(), uuid.v4()).replace(/-/g, '')
              if (data.device_rent_conf.rent == false) {
                if (data.device_rent_conf.rentId) {
                  rentId = data.device_rent_conf.rentId;
                } else {
                  data.device_rent_conf.rentId = rentId;
                }
              } else {
                data.device_rent_conf.rentId = rentId;
                data.device_rent_conf.start_time = Date.now()
              }

              data.device_rent_conf.now = Date.now()
              data.rentId = rentId;
              console.log("user_rent_conf set device rent conf:" + data.serial + ":" + JSON.stringify(data.device_rent_conf))
              var owner
              if (data.device_rent_conf.rent) {
                owner = data.device_rent_conf.owner
              } else {
                owner = null
              }
              return dbapi.setDeviceRentConfByUser(data.serial, data.device_rent_conf)
                .then(function () {
                  console.log("rentowner3:" + JSON.stringify(owner))
                  dbapi.setDeviceOwner(data.serial, owner).then(function () {
                    return dbapi.loadDevice(data.serial)
                  }).then(function (device) {
                    if (device) {
                      console.log("send device.change")
                      io.emit('device.change', {
                        important: true
                        , data: {
                          serial: device.serial
                          , notes: device.notes
                          , device_rent_conf: data.device_rent_conf
                          , owner: owner
                        }
                      })
                      push.send([
                        device.channel
                        , wireutil.envelope(new wire.DeviceRentMessage(
                          device.serial,
                          data.device_rent_conf.rent,
                          data.device_rent_conf.rent_time,
                          Date.now()
                        ))
                      ])
                    }
                    return device
                  })
                    .then(function (device) {
                      var rentId = device.device_rent_conf.rentId
                      var time = Date.now() - device.device_rent_conf.start_time;
                      console.log("start:" + device.device_rent_conf.start_time);
                      console.log("now:" + Date.now());
                      console.log("1now2:" + device.device_rent_conf.now);
                      console.log("time:" + time);
                      var t2 = Math.round((time % (1000 * 3600)) / (1000 * 60.0));
                      var datenow = new Date();
                      if (device.device_rent_conf.rent == false) {
                        datenow = new Date(device.device_rent_conf.start_time)
                      }
                      var curtime = datenow.Format("yyyy-MM-dd HH:mm:ss");
                      var logconf = {
                        serial: device.serial,
                        rentId: rentId,
                        manufacturer: device.manufacturer,
                        model: device.model,
                        platform: device.platform,
                        version: device.version,
                        CurrentTime: curtime,
                        test_centerCode: device.productNo ? device.productNo : "---",
                        mac_address: "---",
                        device_type: '---',
                        rent_time: device.device_rent_conf.rent_time,
                        start_time: device.device_rent_conf.start_time,
                        real_rent_time: t2,
                        owner_email: device.device_rent_conf.owner.email,
                        owner_name: device.device_rent_conf.owner.name + '\\' + device.device_rent_conf.owner.NameCN,
                        owner_group: device.device_rent_conf.owner.group,
                        ProjectCode: device.device_rent_conf.project.ProjectCode,
                        ProjectName: device.device_rent_conf.project.ProjectName

                      };
                      if (device.deviceType == "现场测试") {
                        time = Date.now() - device.device_rent_conf.start_time;
                        console.log("start_time:" + device.device_rent_conf.start_time)
                        console.log("time:" + time)
                        if (data.device_rent_conf.rent == true) {
                          logconf.using_time_start = device.device_rent_conf.start_time;
                        } else {
                          var t3 = Math.round((time % (1000 * 3600)) / (1000 * 60.0));
                          logconf.using_time = t3
                        }
                      }
                      //  console.log("config:" + JSON.stringify(logconf));
                      return dbapi.saveDeviceUsingLog(rentId, logconf)
                    })

                })

            })
          } catch (err) {

          }

        })
        // Client specific messages
        //
        // Settings
        .on('user.settings.update', function (data) {
          dbapi.updateUserSettings(user.email, data)
        })
        .on('user.settings.reset', function () {
          dbapi.resetUserSettings(user.email)
        })
        .on('user.keys.accessToken.generate', function (data) {
          var jwt = jwtutil.encode({
            payload: {
              email: user.email
              , name: user.name
            }
            , secret: options.secret
          })

          var tokenId = util.format('%s-%s', uuid.v4(), uuid.v4()).replace(/-/g, '')
          var title = data.title

          return dbapi.saveUserAccessToken(user.email, {
            title: title
            , id: tokenId
            , jwt: jwt
          })
            .then(function () {
              socket.emit('user.keys.accessToken.generated', {
                title: title
                , tokenId: tokenId
              })
            })
        })
        .on('user.keys.accessToken.remove', function (data) {
          return dbapi.removeUserAccessToken(user.email, data.title)
            .then(function () {
              socket.emit('user.keys.accessToken.removed', data.title)
            })
        })
        .on('user.keys.adb.add', function (data) {
          console.log("user.keys.adb.add:" + JSON.stringify(data))
          return adbkit.util.parsePublicKey(data.key)
            .then(function (key) {
              return dbapi.lookupUsersByAdbKey(key.fingerprint)
                .then(function (cursor) {
                  return cursor.toArray()
                })
                .then(function (users) {
                  if (users.length) {
                    throw new dbapi.DuplicateSecondaryIndexError()
                  }
                  else {
                    return dbapi.insertUserAdbKey(user.email, {
                      title: data.title
                      , fingerprint: key.fingerprint
                    })
                  }
                })
                .then(function () {
                  socket.emit('user.keys.adb.added', {
                    title: data.title
                    , fingerprint: key.fingerprint
                  })
                })
            })
            .then(function () {
              push.send([
                wireutil.global
                , wireutil.envelope(new wire.AdbKeysUpdatedMessage())
              ])
            })
            .catch(dbapi.DuplicateSecondaryIndexError, function (err) {
              socket.emit('user.keys.adb.error', {
                message: 'Someone already added this key'
              })
            })
            .catch(Error, function (err) {
              socket.emit('user.keys.adb.error', {
                message: err.message
              })
            })
        })
        .on('user.keys.adb.accept', function (data) {
          console.log("user.keys.adb.accept:" + JSON.stringify(data))
          return dbapi.lookupUsersByAdbKey(data.fingerprint)
            .then(function (cursor) {
              return cursor.toArray()
            })
            .then(function (users) {
              console.log("users length:" + users.length)
              if (users.length) {
                throw new dbapi.DuplicateSecondaryIndexError()
              }
              else {
                return dbapi.insertUserAdbKey(user.email, {
                  title: data.title
                  , fingerprint: data.fingerprint
                })
              }
            })
            .then(function () {
              socket.emit('user.keys.adb.added', {
                title: data.title
                , fingerprint: data.fingerprint
              })
            })
            .then(function () {
              push.send([
                user.group
                , wireutil.envelope(new wire.AdbKeysUpdatedMessage())
              ])
            })
            .catch(dbapi.DuplicateSecondaryIndexError, function () {
              // No-op
              console.log("dbapi.DuplicateSecondaryIndexError")
            })
        })
        .on('user.keys.adb.remove', function (data) {
          return dbapi.deleteUserAdbKey(user.email, data.fingerprint)
            .then(function () {
              socket.emit('user.keys.adb.removed', data)
            })
        })
        // Touch events
        .on('input.touchDown', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.TouchDownMessage(
              data.seq
              , data.contact
              , data.x
              , data.y
              , data.pressure
            ))
          ])
        })
        .on('input.touchMove', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.TouchMoveMessage(
              data.seq
              , data.contact
              , data.x
              , data.y
              , data.pressure
            ))
          ])
        })
        .on('input.touchUp', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.TouchUpMessage(
              data.seq
              , data.contact
            ))
          ])
        })
        .on('input.touchCommit', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.TouchCommitMessage(
              data.seq
            ))
          ])
        })
        .on('input.touchReset', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.TouchResetMessage(
              data.seq
            ))
          ])
        })
        .on('input.gestureStart', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.GestureStartMessage(
              data.seq
            ))
          ])
        })
        .on('input.gestureStop', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.GestureStopMessage(
              data.seq
            ))
          ])
        })
        // Key events
        .on('input.keyDown', createKeyHandler(wire.KeyDownMessage))
        .on('input.keyUp', createKeyHandler(wire.KeyUpMessage))
        .on('input.keyPress', createKeyHandler(wire.KeyPressMessage))
        .on('input.type', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.TypeMessage(
              data.text
            ))
          ])
        })
        .on('display.rotate', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.RotateMessage(
              data.rotation
            ))
          ])
        })
        // Transactions
        .on('clipboard.paste', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.PasteMessage(data.text)
            )
          ])
        })
        .on('clipboard.copy', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.CopyMessage()
            )
          ])
        })
        .on('device.identify', function (channel, responseChannel) {
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.PhysicalIdentifyMessage()
            )
          ])
        })
        .on('device.reboot', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.RebootMessage()
            )
          ])
        })
        .on('account.check', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.AccountCheckMessage(data)
            )
          ])
        })
        .on('account.remove', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.AccountRemoveMessage(data)
            )
          ])
        })
        .on('account.addmenu', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.AccountAddMenuMessage()
            )
          ])
        })
        .on('account.add', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.AccountAddMessage(data.user, data.password)
            )
          ])
        })
        .on('account.get', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.AccountGetMessage(data)
            )
          ])
        })
        .on('sd.status', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.SdStatusMessage()
            )
          ])
        })
        .on('ringer.set', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.RingerSetMessage(data.mode)
            )
          ])
        })
        .on('ringer.get', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.RingerGetMessage()
            )
          ])
        })
        .on('wifi.set', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.WifiSetEnabledMessage(data.enabled)
            )
          ])
        })
        .on('wifi.get', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.WifiGetStatusMessage()
            )
          ])
        })
        .on('group.invite', function (channel, responseChannel, data) {
          console.log("group.invite:"+JSON.stringify(data))
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.GroupMessage(
                new wire.OwnerMessage(
                  user.email
                  , user.name
                  , user.group
                )
                , data.timeout || null
                , wireutil.toDeviceRequirements(data.requirements)
              )
            )
          ])
        })
        .on('group.kick', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          console.log("group.kick:channel:" + channel)
          console.log("group.kick:responseChannel:" + responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.UngroupMessage(
                wireutil.toDeviceRequirements(data.requirements)
              )
            )
          ])
        })
        .on('tx.cleanup', function (channel) {
          leaveChannel(channel)
        })
        .on('tx.punch', function (channel) {
          joinChannel(channel)
          socket.emit('tx.punch', channel)
        })
        .on('shell.command', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.ShellCommandMessage(data)
            )
          ])
        })
        .on('get.predictimg', function (channel, responseChannel, data) {
          var post_data = { 'instances': [{ 'b64': data.img }] }
          var content = JSON.stringify(post_data)
          var http1 = require('http');
          console.log("get.predictimg ");
          var content = JSON.stringify(post_data);
          var tmpUrl = data.url
          tmpUrl = tmpUrl.replace("http://", "")
          var host = tmpUrl.split(":")[0]
          tmpUrl = tmpUrl.replace(host + ":", "")
          var port = parseInt(tmpUrl.split("/")[0])
          var u_path = tmpUrl.replace(port.toString(), "")
          var options = {
            host: host,
            port: port,
            path: u_path,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': content.length
            }
          };

          var req = http1.request(options, function (res) {
            console.log("statusCode: ", res.statusCode);
            console.log("headers: ", res.headers);
            var _data = '';
            res.on('data', function (chunk) {
              _data += chunk;
            });
            res.on('end', function () {
              console.log("\n--->>\nresult:", _data)
              joinChannel(responseChannel)
              var resultJSON = JSON.parse(_data)
              if (parseFloat(resultJSON["predictions"][0][0][0]) > 0.991) {
                console.log("predict result: Success!")
                socket.emit('tx.progress', responseChannel.toString(), new wire.TransactionDoneMessage(
                  "N8K7N17206007791"
                  , 0
                  , true
                  , "Success"
                  , null
                ))
              } else {
                console.log("predict result: Fail!")
                socket.emit('tx.progress', responseChannel.toString(), new wire.TransactionDoneMessage(
                  "N8K7N17206007791"
                  , 0
                  , true
                  , "Fail"
                  , null
                ))
              }
              socket.emit('tx.done', responseChannel.toString(), new wire.TransactionDoneMessage(
                "N8K7N17206007791"
                , 1
                , true
                , 'success'
                , null
              ))
            });
          })

          req.on('error', function (e) {
            console.log('error with request : ' + e.message);
            console.log("predict result: Fail 2...")
            socket.emit('tx.progress', responseChannel.toString(), new wire.TransactionDoneMessage(
              "N8K7N17206007791"
              , 0
              , true
              , "Fail"
              , null
            ))
            socket.emit('tx.done', responseChannel.toString(), new wire.TransactionDoneMessage(
              "N8K7N17206007791"
              , 1
              , true
              , 'success'
              , null
            ))

          });
          req.write(content);
          req.end();
          console.log("get.predictimg End");

        })
        .on('get.verifycode', function (channel, responseChannel, result) {
          request(result.url, function (error, response, body) {
            // console.log("BODY:" + body);
            joinChannel(responseChannel)
            if (error) {
              console.log("get url error")
              socket.emit('tx.done', responseChannel.toString(), new wire.TransactionDoneMessage(
                "N8K7N17206007791"
                , 0
                , true
                , 'fail'
                , null
              ))
              return
            }
            var str1 = "[^>]+</td><td[^<]+" + result.pnumber
            var reg = new RegExp(str1, "i")
            var tmpResult = body.toString().match(reg)
            console.log("tmp result: " + tmpResult)
            var verifyCode = "null"
            if (tmpResult != null) {
              verifyCode = tmpResult.toString().split('<')[0].trim()
              console.log("got result: " + verifyCode)
            } else {
              console.log("cannot find verify code!")
            }

            socket.emit('tx.progress', responseChannel.toString(), new wire.TransactionDoneMessage(
              "N8K7N17206007791"
              , 0
              , true
              , verifyCode
              , null
            ))
            console.log("send Donenull")
            socket.emit('tx.done', responseChannel.toString(), new wire.TransactionDoneMessage(
              "N8K7N17206007791"
              , 1
              , true
              , 'success'
              , null
            ))
          })
        })
        .on('shell.keepalive', function (channel, data) {
          push.send([
            channel
            , wireutil.envelope(new wire.ShellKeepAliveMessage(data))
          ])
        })
        .on('device.install', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.InstallMessage(
                data.href
                , data.launch === true
                , JSON.stringify(data.manifest)
              )
            )
          ])
        })
        .on('device.uninstall', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.UninstallMessage(data)
            )
          ])
        })
        .on('storage.upload', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          request.postAsync({
            url: util.format(
              '%sapi/v1/resources?channel=%s'
              , options.storageUrl
              , responseChannel
            )
            , json: true
            , body: {
              url: data.url
            }
          })
            .catch(function (err) {
              log.error('Storage upload had an error', err.stack)
              leaveChannel(responseChannel)
              socket.emit('tx.cancel', responseChannel, {
                success: false
                , data: 'fail_upload'
              })
            })
        })
        .on('forward.test', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          if (!data.targetHost || data.targetHost === 'localhost') {
            data.targetHost = user.ip
          }
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.ForwardTestMessage(data)
            )
          ])
        })
        .on('forward.create', function (channel, responseChannel, data) {
          if (!data.targetHost || data.targetHost === 'localhost') {
            data.targetHost = user.ip
          }
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.ForwardCreateMessage(data)
            )
          ])
        })
        .on('forward.remove', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.ForwardRemoveMessage(data)
            )
          ])
        })
        .on('logcat.start', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.LogcatStartMessage(data)
            )
          ])
        })
        .on('logcat.stop', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.LogcatStopMessage()
            )
          ])
        })
        .on('connect.start', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.ConnectStartMessage()
            )
          ])
        })
        .on('connect.stop', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.ConnectStopMessage()
            )
          ])
        })
        .on('browser.open', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.BrowserOpenMessage(data)
            )
          ])
        })
        .on('browser.clear', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.BrowserClearMessage(data)
            )
          ])
        })
        .on('store.open', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.StoreOpenMessage()
            )
          ])
        })
        .on('screen.capture', function (channel, responseChannel) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.ScreenCaptureMessage()
            )
          ])
        })
        .on('fs.retrieve', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.FileSystemGetMessage(data)
            )
          ])
        })
        .on('fs.list', function (channel, responseChannel, data) {
          joinChannel(responseChannel)
          push.send([
            channel
            , wireutil.transaction(
              responseChannel
              , new wire.FileSystemListMessage(data)
            )
          ])
        })
    })
      .finally(function () {
        // Clean up all listeners and subscriptions
        channelRouter.removeListener(wireutil.global, messageListener)
        channels.forEach(function (channel) {
          channelRouter.removeListener(channel, messageListener)
          sub.unsubscribe(channel)
        })
      })
      .catch(function (err) {
        // Cannot guarantee integrity of client
        log.error(
          'Client had an error, disconnecting due to probable loss of integrity'
          , err.stack
        )

        socket.disconnect(true)
      })
  })

  lifecycle.observe(function () {
    [push, sub].forEach(function (sock) {
      try {
        sock.close()
      }
      catch (err) {
        // No-op
      }
    })
  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
