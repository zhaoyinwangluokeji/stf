var util = require('util')

var _ = require('lodash')
var Promise = require('bluebird')
var uuid = require('uuid')

var dbapi = require('../../../db/api')
var logger = require('../../../util/logger')
var datautil = require('../../../util/datautil')
var deviceutil = require('../../../util/deviceutil')
var wire = require('../../../wire')
var wireutil = require('../../../wire/util')
var wirerouter = require('../../../wire/router')

var log = logger.createLogger('api:controllers:user')
var soap = require('soap')
var CircularJSON = require('circular-json');

module.exports = {
  getUser: getUser
  , getUserDevices: getUserDevices
  , addUserDevice: addUserDevice
  , getUserDeviceBySerial: getUserDeviceBySerial
  , deleteUserDeviceBySerial: deleteUserDeviceBySerial
  , remoteConnectUserDeviceBySerial: remoteConnectUserDeviceBySerial
  , remoteDisconnectUserDeviceBySerial: remoteDisconnectUserDeviceBySerial
  , getUserAccessTokens: getUserAccessTokens
  , updateAllUsers: updateAllUsers
}

function getUser(req, res) {
  res.json({
    success: true
    , user: req.user
  })
}

function getUserDevices(req, res) {
  var fields = req.swagger.params.fields.value

  dbapi.loadUserDevices(req.user.email)
    .then(function (cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function (list) {
          var deviceList = []

          list.forEach(function (device) {
            datautil.normalize(device, req.user)
            var responseDevice = device
            if (fields) {
              responseDevice = _.pick(device, fields.split(','))
            }
            deviceList.push(responseDevice)
          })

          res.json({
            success: true
            , devices: deviceList
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

function getUserDeviceBySerial(req, res) {
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

      datautil.normalize(device, req.user)
      if (!deviceutil.isOwnedByUser(device, req.user)) {
        return res.status(403).json({
          success: false
          , description: 'Device is not owned by you'
        })
      }

      var responseDevice = device
      if (fields) {
        responseDevice = _.pick(device, fields.split(','))
      }

      res.json({
        success: true
        , device: responseDevice
      })
    })
    .catch(function (err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function addUserDevice(req, res) {
  var serial = req.body.serial
  var timeout = req.body.timeout || null

  dbapi.loadDevice(serial)
    .then(function (device) {
      if (!device) {
        return res.status(404).json({
          success: false
          , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      if (!deviceutil.isAddable(device, req.user)) {
        return res.status(403).json({
          success: false
          , description: 'Device is being used or not available'
        })
      }

      // Timer will be called if no JoinGroupMessage is received till 5 seconds
      var responseTimer = setTimeout(function () {
        req.options.channelRouter.removeListener(wireutil.global, messageListener)
        return res.status(504).json({
          success: false
          , description: 'Device is not responding'
        })
      }, 5000)

      var messageListener = wirerouter()
        .on(wire.JoinGroupMessage, function (channel, message) {
          if (message.serial === serial && message.owner.email === req.user.email) {
            clearTimeout(responseTimer)
            req.options.channelRouter.removeListener(wireutil.global, messageListener)

            return res.json({
              success: true
              , description: 'Device successfully added'
            })
          }
        })
        .handler()

      req.options.channelRouter.on(wireutil.global, messageListener)
      var usage = 'automation'

      req.options.push.send([
        device.channel
        , wireutil.envelope(
          new wire.GroupMessage(
            new wire.OwnerMessage(
              req.user.email
              , req.user.name
              , req.user.group
            )
            , timeout
            , wireutil.toDeviceRequirements({
              serial: {
                value: serial
                , match: 'exact'
              }
            })
            , usage
          )
        )
      ])
    })
    .catch(function (err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function deleteUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function (device) {
      if (!device) {
        return res.status(404).json({
          success: false
          , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      if (!deviceutil.isOwnedByUser(device, req.user)) {
        return res.status(403).json({
          success: false
          , description: 'You cannot release this device. Not owned by you'
        })
      }

      // Timer will be called if no JoinGroupMessage is received till 5 seconds
      var responseTimer = setTimeout(function () {
        req.options.channelRouter.removeListener(wireutil.global, messageListener)
        return res.status(504).json({
          success: false
          , description: 'Device is not responding'
        })
      }, 5000)

      var messageListener = wirerouter()
        .on(wire.LeaveGroupMessage, function (channel, message) {
          if (message.serial === serial && message.owner.email === req.user.email) {
            clearTimeout(responseTimer)
            req.options.channelRouter.removeListener(wireutil.global, messageListener)

            return res.json({
              success: true
              , description: 'Device successfully removed'
            })
          }
        })
        .handler()

      req.options.channelRouter.on(wireutil.global, messageListener)

      req.options.push.send([
        device.channel
        , wireutil.envelope(
          new wire.UngroupMessage(
            wireutil.toDeviceRequirements({
              serial: {
                value: serial
                , match: 'exact'
              }
            })
          )
        )
      ])
    })
    .catch(function (err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function remoteConnectUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function (device) {
      if (!device) {
        return res.status(404).json({
          success: false
          , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      if (!deviceutil.isOwnedByUser(device, req.user)) {
        return res.status(403).json({
          success: false
          , description: 'Device is not owned by you or is not available'
        })
      }

      var responseChannel = 'txn_' + uuid.v4()
      req.options.sub.subscribe(responseChannel)

      // Timer will be called if no JoinGroupMessage is received till 5 seconds
      var timer = setTimeout(function () {
        req.options.channelRouter.removeListener(responseChannel, messageListener)
        req.options.sub.unsubscribe(responseChannel)
        return res.status(504).json({
          success: false
          , description: 'Device is not responding'
        })
      }, 5000)

      var messageListener = wirerouter()
        .on(wire.ConnectStartedMessage, function (channel, message) {
          if (message.serial === serial) {
            clearTimeout(timer)
            req.options.sub.unsubscribe(responseChannel)
            req.options.channelRouter.removeListener(responseChannel, messageListener)

            return res.json({
              success: true
              , remoteConnectUrl: message.url
            })
          }
        })
        .handler()

      req.options.channelRouter.on(responseChannel, messageListener)

      req.options.push.send([
        device.channel
        , wireutil.transaction(
          responseChannel
          , new wire.ConnectStartMessage()
        )
      ])
    })
    .catch(function (err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function remoteDisconnectUserDeviceBySerial(req, res) {
  var serial = req.swagger.params.serial.value

  dbapi.loadDevice(serial)
    .then(function (device) {
      if (!device) {
        return res.status(404).json({
          success: false
          , description: 'Device not found'
        })
      }

      datautil.normalize(device, req.user)
      if (!deviceutil.isOwnedByUser(device, req.user)) {
        return res.status(403).json({
          success: false
          , description: 'Device is not owned by you or is not available'
        })
      }

      var responseChannel = 'txn_' + uuid.v4()
      req.options.sub.subscribe(responseChannel)

      // Timer will be called if no JoinGroupMessage is received till 5 seconds
      var timer = setTimeout(function () {
        req.options.channelRouter.removeListener(responseChannel, messageListener)
        req.options.sub.unsubscribe(responseChannel)
        return res.status(504).json({
          success: false
          , description: 'Device is not responding'
        })
      }, 5000)

      var messageListener = wirerouter()
        .on(wire.ConnectStoppedMessage, function (channel, message) {
          if (message.serial === serial) {
            clearTimeout(timer)
            req.options.sub.unsubscribe(responseChannel)
            req.options.channelRouter.removeListener(responseChannel, messageListener)

            return res.json({
              success: true
              , description: 'Device remote disconnected successfully'
            })
          }
        })
        .handler()

      req.options.channelRouter.on(responseChannel, messageListener)

      req.options.push.send([
        device.channel
        , wireutil.transaction(
          responseChannel
          , new wire.ConnectStopMessage()
        )
      ])
    })
    .catch(function (err) {
      log.error('Failed to load device "%s": ', req.params.serial, err.stack)
      res.status(500).json({
        success: false
      })
    })
}

function getUserAccessTokens(req, res) {
  dbapi.loadAccessTokens(req.user.email)
    .then(function (cursor) {
      return Promise.promisify(cursor.toArray, cursor)()
        .then(function (list) {
          var titles = []
          list.forEach(function (token) {
            titles.push(token.title)
          })
          res.json({
            success: true
            , titles: titles
          })
        })
    })
    .catch(function (err) {
      log.error('Failed to load tokens: ', err.stack)
      res.status(500).json({
        success: false
      })
    })
}


function updateAllUsers(req, res) {

  var user = req.query.user ? req.query.user : "";
  var ip = req.ip
  var UsersSynBar = "UsersSynBar"
  var url = 'http://99.1.26.7:8012/Services/WebService.asmx?wsdl';
  var args = { 'clientName': 'tm', 'clientCode': '201006', 'currMaxId': '0' };
  console.log('updateAllUsers get from url:' + url);
  soap.createClientAsync(url, { timeout: 5000 }).then((client) => {
    return client.GetUserList(args, function (err, result) {
      if (err) {
        console.log('Fail to GetUserList:' + CircularJSON.stringify(err));
        res.json({
          success: false
          , info: err
        })
        dbapi.updateProcessBar(user, UsersSynBar, {}, true)
      }
      else {
        console.log('result:');
        //  console.log(CircularJSON.stringify(result));
        res.json({
          success: true
          , total: result.GetUserListResult.UserInfo.length
        })
        dbapi.updateProcessBar(user, UsersSynBar,
          {
            user: user,
            name: UsersSynBar,
            total: 100,
            curIndex: 0,
            restart: true,
            fail: false
          }
        ).then(
          function () {
            console.log('updateProjects start ...');
            var Users = []
            var UsersEmail = []
            var UsersName = []
            var UserLoginNames = []

            var testerUser = []
            var developer = []

            dbapi.updateProcessBar(user, UsersSynBar, {
              user: user,
              name: UsersSynBar,
              total: 100,
              curIndex: 5
            }).then(function () {
              result.GetUserListResult.UserInfo.forEach(element => {
                //  if (element.UserStatus == "在职") 
                {
                  var usero = {
                    "name": element.UserLoginName,
                    "email": element.Email,
                    "ip": ip,
                    "UserId": element.UserId,
                    "NameCN": element.UserName,
                    "UserLoginName": element.UserLoginName,
                    "DeptCode": element.DeptCode,
                    "DeptPath": element.DeptPath,
                    "Company": element.Company,
                    "UserStatus": element.UserStatus,
                    "MobilePhone": element.MobilePhone,
                    "DeptManager": element.DeptManager,
                    "TeamLeader": element.TeamLeader,
                    "Gender": element.Gender
                  }
                  if (!usero.email || usero.email == "") {
                    usero.email = usero.name + "@cmbchina.com"
                  }
                  if (usero.name) {
                    if (usero.email && usero.email != "") {
                      UsersEmail.push(usero.email)
                    }
                    UserLoginNames.push(usero.UserLoginName)
                    UsersName.push(usero.name)
                    Users.push(usero)

                    if (usero.DeptCode && usero.UserStatus == "在职") {
                      var user1={
                        "name":usero.name,
                        "email":usero.email,
                        "NameCN":usero.NameCN
                      }
                      if (usero.DeptCode.indexOf('T') != -1) {
                        
                        testerUser.push(user1)
                      } else {
                        developer.push(user1)
                      }
                    }

                  } else {
                    console.log("Lack UserInfo:" + JSON.stringify(usero))
                  }

                }
              });

              var length = Users.length
              var stepone = Math.ceil(length / 70)
              console.log("length:" + length)
              console.log("stepone:" + stepone)

              dbapi.updateProcessBar(user, UsersSynBar, {
                user: user,
                name: UsersSynBar,
                total: 100,
                curIndex: 8
              }).then(function () {
                dbapi.deleteExistsUser(UsersEmail, UsersName, UserLoginNames).then(function () {
                  console.log("delete end")
                  var AllPromises = []
                  dbapi.updateProcessBar(user, UsersSynBar, {
                    user: user,
                    name: UsersSynBar,
                    total: 100,
                    curIndex: 10
                  }).then(function () {
                    Users.map((element, index, array) => {
                      AllPromises.push(dbapi.updateUser(element).then(
                        function () {
                          if ((index % stepone) == 0) {
                            console.log('update user step1 rate:' + (10 + index / stepone) + "%");
                            return dbapi.updateProcessBar(user, UsersSynBar, {
                              user: user,
                              name: UsersSynBar,
                              total: 100,
                              curIndex: (10 + (index / stepone))
                            }).then(function () {
                              if ((index % stepone) == 0) {
                                console.log('update user step2 rate:' + (10 + index / stepone) + "%");
                              } else if (index >= length) {
                                console.log('update user step2  rate > End,100%')
                              }
                            })
                          }
                        })

                      )
                    })
                    Promise.all(AllPromises).then(function (result) {
                      console.log('update user step3 End')
                      return dbapi.updateProcessBar(user, UsersSynBar, {
                        user: user,
                        name: UsersSynBar,
                        total: 100,
                        curIndex: 80
                      }).then(function () {
                        console.log('update user step4  rate > End')
                        console.log('start update usergroup...')

                        var Groups=[{group:"tester",userslist:testerUser},
                                    {group:"developer",userslist:developer}]
                        
                        var AllPromises2=[]
                        Groups.map((group_ele, group_index, group_array) => {
                          AllPromises2.push(
                          dbapi.loadGroupFName(group_ele.group).then(function (result) {
                            return result.toArray()
                          }).then(function (list) {
                            var group = list[0]
                            var userslist = group_ele.userslist
                            var userslist_s = group.userslist
                            if (!userslist_s) userslist_s = []
                            userslist.forEach(element => {
                              var find = false
                              userslist_s.forEach(ele => {
                                if (ele.name == element.name && ele.email == ele.email) {
                                  find = true
                                  return false
                                }
                              })
                              if (find == false) {
                                userslist_s.push(element)
                              }
                            })
                            var msg = ""
                            userslist.forEach(element => {
                              msg += element.name + ","
                            });
                            //  console.log("SetUsersListOfGroup:" + JSON.stringify(userslist_s))
                            dbapi.SetUsersListOfGroup(group_ele.group, userslist_s).then(function () {
                            })
                          })
                          )
                        })
                        Promise.all(AllPromises2).then(function (result) {
                          return dbapi.updateProcessBar(user, UsersSynBar, {
                            user: user,
                            name: UsersSynBar,
                            total: 100,
                            curIndex: 100
                          }).then(function(){
                            console.log('update user all End')
                          }
                         
                          )
                        })

                      })
                    })
                  })
                })
              })
            })
          }
        )
      }
    })
  }).then((result) => {
    console.log('recv:');
  }).catch(function (err) {
    console.log('error:' + CircularJSON.stringify(err));
    res.json({
      success: false
      , info: CircularJSON.stringify(err)
    })
  });

}


