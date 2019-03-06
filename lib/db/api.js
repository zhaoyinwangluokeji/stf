var r = require('rethinkdb')
var util = require('util')
var db = require('./')
var wireutil = require('../wire/util')

var CircularJSON = require('circular-json');

var dbapi = Object.create(null)

dbapi.DuplicateSecondaryIndexError = function DuplicateSecondaryIndexError() {
  Error.call(this)
  this.name = 'DuplicateSecondaryIndexError'
  Error.captureStackTrace(this, DuplicateSecondaryIndexError)
}

util.inherits(dbapi.DuplicateSecondaryIndexError, Error)

dbapi.close = function (options) {
  return db.close(options)
}

dbapi.saveUserAfterLogin = function (user) {
  return db.run(r.table('users').filter(function (row) {
    return row('email').eq(user.email).or(row('name').eq(user.name))
  }
  ).update({
    name: user.name
    , ip: user.ip
    , lastLoggedInAt: r.now()
  }))
    .then(function (stats) {
      if (stats.skipped) {
        return db.run(r.table('users').insert({
          email: user.email
          , name: user.name
          , ip: user.ip
          , group: wireutil.makePrivateChannel()
          , lastLoggedInAt: r.now()
          , createdAt: r.now()
          , forwards: []
          , settings: {}

        }))
      }
      return stats
    })
}

dbapi.deleteExistsUser = function (useremails, usernames, UserLoginNames) {
  console.log("deleteExistsUser")
  return db.run(r.table('users').filter(
    function (row) {
      return r.expr(useremails)
        .contains(row("email")).or(
          r.expr(usernames)
            .contains(row("name"))
        ).or(
          r.expr(UserLoginNames)
            .contains(row("UserLoginName"))
        )
    }
  ).delete()).then(function (stat) {
    console.log("deleteExistsUser End")
    return stat
  })
}

dbapi.updateUser = function (user) {

  return db.run(r.table('users').filter(
    function (row) {
      return row('email').eq(user.email).or(row('name').eq(user.name))
    }
  ).delete()).then(function () {
    return db.run(r.table('users').insert({
      email: user.email
      , name: user.name
      , ip: user.ip
      , group: wireutil.makePrivateChannel()
      , lastLoggedInAt: r.now()
      , createdAt: r.now()
      , forwards: []
      , settings: {}
      , UserId: user.UserId,
      UserLoginName: user.UserLoginName,
      DeptCode: user.DeptCode,
      DeptPath: user.DeptPath,
      Company: user.Company,
      NameCN: user.NameCN,
      UserStatus: user.UserStatus,
      MobilePhone: user.MobilePhone,
      DeptManager: user.DeptManager,
      TeamLeader: user.TeamLeader,
      Gender: user.Gender
    }))

  })

}

dbapi.getAllCompatResult = function(){
  return db.run(r.table('CompatResult'))
}

dbapi.getCompatResultById = function(id){
  console.log('getting id: ' + id)
  return db.run(r.table('CompatResult').get(id))
}

dbapi.addCompatResult = function(id,platform,resultData,packageName,activity,appVersion,state,taskNum,user,uninstall){
  var createTime = r.now()
  var data = {
    id: id,
    user:user,
    platform: platform | 'Android',
    data: resultData,
    packageName: packageName,
    activity: activity,
    appVersion: appVersion,
    state:state,
    submitTime: createTime,
    lastUpdate:createTime,
    taskNum: taskNum,
    finished: 0,
    passed: 0,
    ifUninstall: uninstall,
  }
  return db.run(r.table('CompatResult').get(id).update(data))
    .then(function (stats) {
      if (stats.skipped) {
        return db.run(r.table('CompatResult').insert(data))
      }
      return stats
    })
}


dbapi.updateCompatResult = function(id,resultData,finished,state,passed){
  var data = {
    id: id,
    data: resultData,
    state:state,
    lastUpdate: r.now(),
    finished: finished,
    passed: passed,
  }
  return db.run(r.table('CompatResult').get(id).update(data))
    .then(function (stats) {
      if (stats.skipped) {
        return false
      }else{
        return stats
      }
    })
}

dbapi.addDevice = function (device) {
  var data = {
    serial: device.serial
    , platform: device.platform
    , version: device.version
    , manufacturer: device.manufacturer
    , model: device.model
    , product: device.model
    , display: device.display
    , createdAt: r.now()
    , deviceType: '现场测试'
    ,productNo: device.productNo
    ,deviceLocation: device.deviceLocation
    ,notes: device.notes

  }
  return db.run(r.table('devices').get(device.serial).update(data))
    .then(function (stats) {
      if (stats.skipped) {
        return db.run(r.table('devices').insert(data))
      }
      return stats
    })

}

dbapi.loadUser = function (email) {
  return db.run(r.table('users').get(email))
}

dbapi.loadUserFromUser = function (user) {
  return db.run(r.table('users').filter(function (row) {
    return row('email').eq(user.email).or(row('name').eq(user.name))
  }))
}

dbapi.updateUserSettings = function (email, changes) {
  return db.run(r.table('users').get(email).update({
    settings: changes
  }))
}

dbapi.resetUserSettings = function (email) {
  return db.run(r.table('users').get(email).update({
    settings: r.literal({})
  }))
}

dbapi.insertUserAdbKey = function (email, key) {
  return db.run(r.table('users').get(email).update({
    adbKeys: r.row('adbKeys').default([]).append({
      title: key.title
      , fingerprint: key.fingerprint
    })
  }))
}

dbapi.deleteUserAdbKey = function (email, fingerprint) {
  return db.run(r.table('users').get(email).update({
    adbKeys: r.row('adbKeys').default([]).filter(function (key) {
      return key('fingerprint').ne(fingerprint)
    })
  }))
}

dbapi.lookupUsersByAdbKey = function (fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
    index: 'adbKeys'
  }))
}

dbapi.lookupUserByAdbFingerprint = function (fingerprint) {
  return db.run(r.table('users').getAll(fingerprint, {
    index: 'adbKeys'
  })
    .pluck('email', 'name', 'group'))
    .then(function (cursor) {
      return cursor.toArray()
    })
    .then(function (groups) {
      switch (groups.length) {
        case 1:
          return groups[0]
        case 0:
          return null
        default:
          throw new Error('Found multiple users for same ADB fingerprint')
      }
    })
}

dbapi.lookupUserByVncAuthResponse = function (response, serial) {
  return db.run(r.table('vncauth').getAll([response, serial], {
    index: 'responsePerDevice'
  })
    .eqJoin('userId', r.table('users'))('right')
    .pluck('email', 'name', 'group'))
    .then(function (cursor) {
      return cursor.toArray()
    })
    .then(function (groups) {
      switch (groups.length) {
        case 1:
          return groups[0]
        case 0:
          return null
        default:
          throw new Error('Found multiple users with the same VNC response')
      }
    })
}

dbapi.loadUserDevices = function (email) {
  return db.run(r.table('devices').getAll(email, {
    index: 'owner'
  }))
}

dbapi.saveDeviceLog = function (serial, entry) {
  return db.run(r.table('logs').insert({
    serial: serial
    , timestamp: r.epochTime(entry.timestamp)
    , priority: entry.priority
    , tag: entry.tag
    , pid: entry.pid
    , message: entry.message
  }
    , {
      durability: 'soft'
    }))
}
//add device_rent_conf
dbapi.saveDeviceInitialState = function (serial, device) {
  var data = {
    present: false
    , presenceChangedAt: r.now()
    , provider: device.provider
    , owner: null
    , status: device.status
    , statusChangedAt: r.now()
    , ready: false
    , reverseForwards: []
    , remoteConnect: false
    , remoteConnectUrl: null
    , usage: null
    , deviceType: '远程测试'

  }

  return db.run(r.table('devices').get(serial).update(data))
    .then(function (stats) {
      if (stats.skipped) {
        data.serial = serial
        data.createdAt = r.now()
        return db.run(r.table('devices').insert(data))
      }
      return stats
    })
}

dbapi.saveDeviceGroupsInitialState = function (name, usergroups, devices) {
  var data = {
    name: name
    , usergroups: usergroups
    , devices: devices
  }
  return db.run(r.table('DeviceGroups').get(name).update(data))
    .then(function (stats) {
      if (stats.skipped) {
        return db.run(r.table('DeviceGroups').insert(data))
      }
      return stats
    })
}

dbapi.removeDevice = function (serial) {
  return db.run(r.table('devices').filter({ 'serial': serial }).delete())
}

dbapi.removeDeviceGroups = function (name) {
  return db.run(r.table('DeviceGroups').filter({ 'name': name }).delete())
}

dbapi.getAllDeviceGroups = function () {
  return db.run(r.table('DeviceGroups'))
}

dbapi.getAllUserGroups = function () {
  return db.run(r.table('UserGroup'))
}

dbapi.loadDeviceGroupByName = function (name) {
  return db.run(r.table('DeviceGroups').filter({ 'name': name }))
}

dbapi.modifyDeviceGroup = function (group, new_group) {
  console.log("modifying DeviceGroups name: " + group + " to " + new_group)
  return db.run(r.table('DeviceGroups').filter({ 'name': group }).update({
    name: new_group
  }))
}

dbapi.SetDevicesOfDeviceGroup = function (name, devices) {
  return db.run(r.table('DeviceGroups').filter({ 'name': name }).update({
    'devices': devices
  }))
}

dbapi.SetUsersGroupsOfDeviceGroup = function (name, usergroups) {
  return db.run(r.table('DeviceGroups').filter({ 'name': name }).update({
    'usergroups': usergroups
  }))
}

dbapi.setDeviceRentConf = function (serial, device_rent_config) {
  device_rent_config.now = Date.now()
  return db.run(r.table('devices').get(serial).update({
    device_rent_conf: device_rent_config,
    back:'0'
  }))
}

dbapi.setDeviceRentConfByAdmin = function (serial, device_rent_config) {
  device_rent_config.now = Date.now()
  return db.run(r.table('devices').get(serial).update({
    device_rent_conf: device_rent_config,
    back:'1'
  }))
}

dbapi.setDeviceRentConfByUser = function (serial, device_rent_config) {
  device_rent_config.now = Date.now()
  return db.run(r.table('devices').get(serial).update({
    device_rent_conf: device_rent_config
  }))
}

dbapi.setDeviceConnectUrl = function (serial, url) {
  return db.run(r.table('devices').get(serial).update({
    remoteConnectUrl: url
    , remoteConnect: true
  }))
}

dbapi.unsetDeviceConnectUrl = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    remoteConnectUrl: null
    , remoteConnect: false
  }))
}

dbapi.saveDeviceStatus = function (serial, status) {
  return db.run(r.table('devices').get(serial).update({
    status: status
    , statusChangedAt: r.now()
  }))
}

dbapi.setDeviceOwner = function (serial, owner) {
  return db.run(r.table('devices').get(serial).update({
    owner: owner
  }))
}

dbapi.unsetDeviceOwner = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    owner: null
  }))
}

dbapi.setDevicePresent = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    present: true
    , presenceChangedAt: r.now()
  }))
}

dbapi.setDeviceAbsent = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    present: false
    , presenceChangedAt: r.now()
  }))
}

dbapi.setDeviceUsage = function (serial, usage) {
  return db.run(r.table('devices').get(serial).update({
    usage: usage
    , usageChangedAt: r.now()
  }))
}

dbapi.unsetDeviceUsage = function (serial) {
  return db.run(r.table('devices').get(serial).update({
    usage: null
    , usageChangedAt: r.now()
  }))
}

dbapi.setDeviceAirplaneMode = function (serial, enabled) {
  return db.run(r.table('devices').get(serial).update({
    airplaneMode: enabled
  }))
}

dbapi.setDeviceBattery = function (serial, battery) {
  return db.run(r.table('devices').get(serial).update({
    battery: {
      status: battery.status
      , health: battery.health
      , source: battery.source
      , level: battery.level
      , scale: battery.scale
      , temp: battery.temp
      , voltage: battery.voltage
    }
  }
    , {
      durability: 'soft'
    }))
}

dbapi.setDeviceBrowser = function (serial, browser) {
  return db.run(r.table('devices').get(serial).update({
    browser: {
      selected: browser.selected
      , apps: browser.apps
    }
  }))
}

dbapi.setDeviceConnectivity = function (serial, connectivity) {
  return db.run(r.table('devices').get(serial).update({
    network: {
      connected: connectivity.connected
      , type: connectivity.type
      , subtype: connectivity.subtype
      , failover: !!connectivity.failover
      , roaming: !!connectivity.roaming
    }
  }))
}

dbapi.setDevicePhoneState = function (serial, state) {
  return db.run(r.table('devices').get(serial).update({
    network: {
      state: state.state
      , manual: state.manual
      , operator: state.operator
    }
  }))
}

dbapi.setDeviceRotation = function (serial, rotation) {
  return db.run(r.table('devices').get(serial).update({
    display: {
      rotation: rotation
    }
  }))
}

dbapi.setDeviceNote = function (serial, note) {
  return db.run(r.table('devices').get(serial).update({
    notes: note
  }))
}

dbapi.setDeviceMaintain = function (serial, maintain) {
  return db.run(r.table('devices').get(serial).update({
    maintain: maintain
  }))
}

dbapi.setDeviceReverseForwards = function (serial, forwards) {
  return db.run(r.table('devices').get(serial).update({
    reverseForwards: forwards
  }))
}

dbapi.setDeviceReady = function (serial, channel) {
  return db.run(r.table('devices').get(serial).update({
    channel: channel
    , ready: true
    , owner: null
    , reverseForwards: []
  }))
}

dbapi.saveDeviceIdentity = function (serial, identity) {
  return db.run(r.table('devices').get(serial).update({
    platform: identity.platform
    , manufacturer: identity.manufacturer
    , operator: identity.operator
    , model: identity.model
    , version: identity.version
    , abi: identity.abi
    , sdk: identity.sdk
    , display: identity.display
    , phone: identity.phone
    , product: identity.product
    , cpuPlatform: identity.cpuPlatform
    , openGLESVersion: identity.openGLESVersion
  }))
}

dbapi.loadDevices = function() {
    return db.run(r.table('devices').update({
          device_rent_conf:{
          now:Date.now()
          }
        }
      )
    ).then(function(x){
        return db.run(r.table('devices'))
    })
}

dbapi.loadPresentDevices = function() {
  return db.run(r.table('devices').getAll(true, {
    index: 'present'
  }).update({
    device_rent_conf: {
      now: Date.now()
    }
  })
  ).then(function (x) {
    return db.run(r.table('devices').getAll(true, {
      index: 'present'
    }))

  })
}

dbapi.getAllDevices = function (serial) {
  return db.run(r.table('devices'))

}

dbapi.loadDevice = function(serial) {
  return db.run(r.table('devices').get(serial))

}

dbapi.saveUserAccessToken = function (email, token) {

  return db.run(r.table('accessTokens').insert({
    email: email
    , id: token.id
    , title: token.title
    , jwt: token.jwt
  }))
}

dbapi.removeUserAccessToken = function (email, title) {
  return db.run(r.table('accessTokens').getAll(email, {
    index: 'email'
  }).filter({ title: title }).delete())
}

dbapi.loadAccessTokens = function (email) {
  return db.run(r.table('accessTokens').getAll(email, {
    index: 'email'
  }))
}

dbapi.loadAccessToken = function (id) {
  return db.run(r.table('accessTokens').get(id))
}

dbapi.getProcessBar = function (user, name) {
  if (user) {
    return db.run(r.table('ProgressBar')
      .filter(r.row("user").match(user).and(r.row("name").match(name)))
    )
  } else {
    return db.run(r.table('ProgressBar')
      .filter(r.row("name").match(name))
    )
  }
}


dbapi.updateProcessBar = function (user, name, processBar, error) {
  if (error && error == true) {
    //  console.log('update error ProcessBar')
    return db.run(r.table('ProgressBar')
      .filter({
        user: user,
        name: name
      }).count()).then(function (rowcnt) {

        if (rowcnt == 0) {
          console.log('insert error ProcessBar1')
          processBar.fail = true
          processBar.user = user
          processBar.name = name
          processBar.restart = false
          return db.run(r.table('ProgressBar').insert(processBar))
        } else {

          if (processBar.restart) {
            db.run(r.table('ProgressBar')
              .filter({
                user: user,
                name: name
              }).delete()).then(function () {
                console.log('insert error ProcessBar1')
                processBar.fail = true
                processBar.user = user
                processBar.name = name
                processBar.restart = false
                return db.run(r.table('ProgressBar').insert(processBar))
              })
          }
          db.run(r.table('ProgressBar')
            .filter({
              user: user,
              name: name
            }).update(
              {
                fail: true
              }
            ))
            .then(function (stats) {
              if (stats.skipped) {
                console.log('insert error ProcessBar')
                processBar.fail = true
                processBar.user = user
                processBar.name = name
                return db.run(r.table('ProgressBar').insert(processBar))
              }
              console.log('Update Error ProcessBar')
              return stats
            })
        }

      })

  } else {
    //  console.log('updateProcessBar,user:' + user + ",name:" + name)
    return db.run(r.table('ProgressBar')
      .filter({
        user: user,
        name: name
      }).count()).then(function (rowcnt) {

        if (rowcnt == 0) {
          //  console.log('insert ProcessBar1')
          processBar.fail = true
          processBar.user = user
          processBar.name = name
          processBar.restart = false
          return db.run(r.table('ProgressBar').insert(processBar))
        } else {

          if (processBar.restart) {
            db.run(r.table('ProgressBar')
              .filter({
                user: user,
                name: name
              }).delete()).then(function () {
                //  console.log('insert error ProcessBar1')
                processBar.fail = true
                processBar.user = user
                processBar.name = name
                processBar.restart = false
                return db.run(r.table('ProgressBar').insert(processBar))
              })
          } else {
            return db.run(r.table('ProgressBar').filter({
              user: user,
              name: name
            }
            ).update({
              user: user,
              name: name,
              total: processBar.total,
              curIndex: processBar.curIndex,
              fail: false
            }
            ))
              .then(function (stats) {
                //  console.log('stats :' + CircularJSON.stringify(stats))
                if (stats.skipped) {
                  //  console.log('insert ProcessBar:' + JSON.stringify(processBar))
                  return db.run(r.table('ProgressBar').insert(processBar))
                }
                //  console.log('update ProcessBar')
                return stats
              })
          }
        }
      })

  }

}


dbapi.deleteExistsProjects = function (ProjectCodes) {
  console.log("deleteExistsProjects")
  return db.run(r.table('ProjectInfo').filter(
    function (row) {
      return r.expr(ProjectCodes)
        .contains(row("ProjectCode"))
    }
  ).delete()).then(function (stat) {
    console.log("deleteExistsProjects End")
    return stat
  })
}

dbapi.updateProjectsByProjectCode = function (ProjectCode, projectInfo) {
  return db.run(r.table('ProjectInfo')
    .filter({
      "ProjectCode": ProjectCode
    }).delete()
  ).then(function () {
    return db.run(r.table('ProjectInfo').insert(projectInfo))
  })
}


dbapi.loadProjectsByProjectName = function (projectName) {
  if (!projectName || projectName == "" || projectName == "\"\"") {
    projectName = ""
  }
  return db.run(r.table('ProjectInfo')
    .filter(r.row("ProjectName").match(projectName)).pluck("ProjectCode", "ProjectName").limit(30))

}
dbapi.loadProjectsByProject = function (projectName) {
  if (!projectName || projectName == "" || projectName == "\"\"") {
    projectName = ""
  }

  return db.run(r.table('ProjectInfo')
    .filter(r.row("ProjectName").match(projectName).or(r.row("ProjectCode").match(projectName))).pluck("ProjectCode", "ProjectName").limit(30))
}

dbapi.loadProjectsByProjectId = function (projectId) {
  if (!projectId) projectId = ""
  return db.run(r.table('ProjectInfo')
    .filter(r.row("ProjectId").match(ProjectId)).pluck("ProjectCode", "ProjectName").limit(30))
}
dbapi.loadProjectsByProjectCode = function (projectCode) {
  if (!projectCode) projectCode = ""
  return db.run(r.table('ProjectInfo')
    .filter(r.row("ProjectCode").match(projectCode)).pluck("ProjectCode", "ProjectName").limit(30))
}
dbapi.loadProjectsByUser = function (user) {
  if (!user) user = ""
  return db.run(r.table('ProjectInfo')
    .filter(r.row("PM").match(user)).pluck("ProjectCode", "ProjectName").limit(30))
}
dbapi.loadProjectsByST = function (st_user) {
  if (!st_user) st_user = ""
  return db.run(r.table('ProjectInfo')
    .filter(r.row("ST_PM").match(st_user)).pluck("ProjectCode", "ProjectName").limit(30))
}
dbapi.loadProjectsByUAT = function (uat_user) {
  if (!uat_user) uat_user = ""
  return db.run(r.table('ProjectInfo')
    .filter(r.row("UAT_PM").match(uat_user)).pluck("ProjectCode", "ProjectName").limit(30))
}


dbapi.saveDeviceUsingLog = function (serial, device_log_row) {
  db.run(r.table('DeviceUsingLog').get(serial).update(device_log_row))
    .then(function (stats) {
      if (stats.skipped) {
        console.log('insert DeviceUsingLog')
        device_log_row.real_rent_time = 0
        return db.run(r.table('DeviceUsingLog').insert(device_log_row))
      }
      console.log('update DeviceUsingLog')
      return stats
    })
}

dbapi.getLogs = function (condition, page, count) {
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  console.log("skip:" + skip)
  console.log("limit:" + limit)
  if (condition && condition != "") {
    console.log("getLogs condi:" + condition)
    return db.run(
      r.table("DeviceUsingLog").filter(
        function (row) {
          return row("CurrentTime").ge(condition)
        }
      ).orderBy(r.desc("CurrentTime")).skip(skip).limit(limit)
    )
  } else {
    return db.run(r.table('DeviceUsingLog').orderBy(r.desc("CurrentTime")).limit(50))
  }

}

dbapi.getLogsCount = function (condition) {

  if (condition && condition != "") {

    console.log("getLogs condi:" + condition)
    return db.run(
      r.table("DeviceUsingLog").filter(
        function (row) {
          return row("CurrentTime").ge(condition)
        }
      ).count()
    )
  } else {
    return db.run(r.table('DeviceUsingLog').count())
  }

}

dbapi.getLogsFilter = function (condition, field, filter) {
  console.log("getLogsFilter1")
  if (condition && condition != "" && condition != '1970-07-01') {
    console.log("getLogsFilter1-1 condi:" + condition + ",field=" + field + ",filter=" + filter)
    return db.run(
      r.table("DeviceUsingLog").filter(
        function (row) {
          return row("CurrentTime").ge(condition).and(row(field).match(filter))
        }
      ).orderBy(r.asc("CurrentTime"))
    )
  } else {
    console.log("getLogsFilter1-2")
    return db.run(r.table('DeviceUsingLog').filter(
      function (row) {
        row(field).match(filter)
      }
    ).orderBy(r.desc("CurrentTime")).limit(50))
  }

}

dbapi.getLogsFilterCount = function (condition, field, filter) {
  console.log("getLogsFilter1")
  if (condition && condition != "" && condition != '1970-07-01') {
    console.log("getLogsFilter1-1 condi:" + condition + ",field=" + field + ",filter=" + filter)
    return db.run(
      r.table("DeviceUsingLog").filter(
        function (row) {
          return row("CurrentTime").ge(condition).and(row(field).match(filter))
        }
      ).count()
    )
  } else {
    console.log("getLogsFilter1-2")
    return db.run(r.table('DeviceUsingLog').filter(
      function (row) {
        row(field).match(filter)
      }
    ).count())
  }
}

dbapi.getStatticsPer = function (startdate, enddate, pergroup, page, count) {
  console.log("getStatticsPer")
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  return db.run(
    r.table("DeviceUsingLog").filter(
      function (row) {
        return row('CurrentTime').ge(startdate).and(
          row('CurrentTime').le(enddate)
        )
      }
    ).group(pergroup).ungroup().map(
      function (doc) {
        return {
          'pergroup': doc('group'),
          'count': doc('reduction').count(),
          'SumTimer': doc('reduction').sum('real_rent_time')
        }
      }
    ).skip(skip).limit(limit)
  )
}

dbapi.getStatticsPerDate = function (startdate, enddate, pergroup, page, count, order_by, asc_desc) {
  console.log("getStatticsPerDate")
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  return db.run(
    r.table("DeviceUsingLog").filter(
      function (row) {
        return row('CurrentTime').ge(startdate).and(
          row('CurrentTime').le(enddate)
        )
      }
    ).group(
      function (row) {
        return row('CurrentTime').split(' ')(0);
      }
    ).ungroup().map(
      function (doc) {
        return {
          'pergroup': doc('group'),
          'count': doc('reduction').count(),
          'SumTimer': doc('reduction').sum('real_rent_time')
        }
      }
    ).orderBy(r.asc("pergroup")).skip(skip).limit(limit)
  )
}

dbapi.getStatticsPerCustom = function (startdate, enddate, pergroup, page, count, order_by, asc_desc) {
  console.log("getStatticsPerCustom")
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  return db.run(
    r.table("DeviceUsingLog").filter(
      function (row) {
        return row('CurrentTime').ge(startdate).and(
          row('CurrentTime').le(enddate)
        )
      }
    ).group(
      r.js("(function(r){ return [" + pergroup + "]; })")
    ).ungroup().map(
      function (doc) {
        return {
          pergroup: doc('group'),
          count: doc('reduction').count(),
          SumTimer: doc('reduction').sum('real_rent_time'),
          email: doc('reduction').group('owner_email').ungroup().map(
            function (r) {
              return {
                'email': r('group'),
                'count': [{ num: r('reduction').count() }, { time: r('reduction').sum('real_rent_time') }]
              }
            }
          ),
          owner_name: doc('reduction').group('owner_name').ungroup().map(
            function (r) {
              return {
                'owner_name': r('group'),
                'count': [{ num: r('reduction').count() }, { time: r('reduction').sum('real_rent_time') }]
              }
            }
          )
          ,
          platform: doc('reduction').group('platform').ungroup().map(
            function (r) {
              return {
                'platform': r('group'),
                'count': [{ num: r('reduction').count() }, { time: r('reduction').sum('real_rent_time') }]
              }
            }
          )
          ,
          version: doc('reduction').group('version').ungroup().map(
            function (r) {
              return {
                'version': r('group'),
                'count': [{ num: r('reduction').count() }, { time: r('reduction').sum('real_rent_time') }]
              }
            }
          )
          ,
          manufacturer: doc('reduction').group('manufacturer').ungroup().map(
            function (r) {
              return {
                'manufacturer': r('group'),
                'count': [{ num: r('reduction').count() }, { time: r('reduction').sum('real_rent_time') }]
              }
            }
          )
          ,
          model: doc('reduction').group('model').ungroup().map(
            function (r) {
              return {
                'model': r('group'),
                'count': [{ num: r('reduction').count() }, { time: r('reduction').sum('real_rent_time') }]
              }
            }
          )
          ,
          ProjectCode: doc('reduction').group('ProjectCode').ungroup().map(
            function (r) {
              return {
                'model': r('group'),
                'count': [{ num: r('reduction').count() }, { time: r('reduction').sum('real_rent_time') }]
              }
            }
          )
        }
      }
    ).orderBy(r.asc("pergroup")).skip(skip).limit(limit)
  )
}

dbapi.getStatticsCountPerCustom = function (startdate, enddate, pergroup, page, count, order_by, asc_desc) {
  console.log("getStatticsPerCustom")
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  return db.run(
    r.table("DeviceUsingLog").filter(
      function (row) {
        return row('CurrentTime').ge(startdate).and(
          row('CurrentTime').le(enddate)
        )
      }
    ).group(
      r.js("(function(r){ return [" + pergroup + "]; })")
    ).ungroup().count()
  )
}

dbapi.getStatticsAllCountsPerDate = function (startdate, enddate, pergroup, page, count, order_by, asc_desc) {
  console.log("getStatticsPer")
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  return db.run(
    r.table("DeviceUsingLog").filter(
      function (row) {
        return row('CurrentTime').ge(startdate).and(
          row('CurrentTime').le(enddate)
        )
      }
    ).group(
      function (row) {
        return row('CurrentTime').split(' ')(0);
      }
    ).ungroup().count()
  )
}


dbapi.getStatticsCounts = function (startdate, enddate, pergroup) {
  console.log("getStatticsPer")
  return db.run(
    r.table("DeviceUsingLog").filter(
      function (row) {
        return row('CurrentTime').ge(startdate).and(
          row('CurrentTime').le(enddate)
        )
      }
    ).group(pergroup).ungroup().count()
  )
}

dbapi.registerNewUser = function (user_info, password) {
  return dbapi.saveUserAfterLogin(user_info).
    then(function () {
      return db.run(r.table('UserPasswords').insert(password))
    })
}

dbapi.loadUsersCount = function (filter) {
  filter = filter.toLowerCase()
  return db.run(
    r.table("users").filter(
      function (row) {
        return row('email').downcase().match(filter).or(
          row('name').downcase().match(filter)
        )
      }
    ).count()
  )
}

dbapi.loadUsers = function (page, count, filter) {
  filter = filter.toLowerCase()
  console.log("loadUsers")
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  return db.run(
    r.table("users").filter(
      function (row) {
        return row('email').downcase().match(filter).or(row('name').downcase().match(filter)).or(row('NameCN').downcase().match(filter))
      }
    ).pluck('email', 'name', 'NameCN').skip(skip).limit(limit)
  )
}


dbapi.loadPermissionList = function () {
  return db.run(
    r.table("PermissionTable")
  )
}


dbapi.loadPermissionCount = function (filter) {
  filter = filter.toLowerCase()
  return db.run(
    r.table("PermissionTable").filter(
      function (row) {
        return row('desc').downcase().match(filter).or(
          row('name').downcase().match(filter)
        )
      }
    ).count()
  )
}

dbapi.loadAllPermission = function (page, count, filter) {
  console.log("PermissionTable")
  filter = filter.toLowerCase()
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  return db.run(
    r.table("PermissionTable").filter(
      function (row) {
        return row('desc').downcase().match(filter).or(row('name').downcase().match(filter))
      }
    ).skip(skip).limit(limit)
  )
}
dbapi.loadFilteredDevicesCount = function (filter) {
  filter = filter.toLowerCase()
  return db.run(
    r.table("devices").filter(
      r.row("model").downcase().match(filter)
        .or(r.row("version").downcase().match(filter))
        .or(r.row("serial").downcase().match(filter))
    ).count()
  )
}

dbapi.loadFilteredDevices = function (page, count, filter) {
  // console.log("loadDevices")
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  filter = filter.toLowerCase()
  return db.run(
    r.table("devices").filter(
      r.row("model").downcase().match(filter)
        .or(r.row("version").downcase().match(filter))
        .or(r.row("serial").downcase().match(filter))
    )
      .pluck('serial', 'model', 'version').skip(skip).limit(limit)
  )
}

dbapi.loadFilteredDevicesCount2 = function (filter) {
  filter = filter.toLowerCase()
  return db.run(
    r.table("devices").filter(
      r.row("model").match(filter)
        .or(r.row("manufacturer").downcase().match(filter))
        .or(r.row("platform").downcase().match(filter))
        .or(r.row("version").downcase().match(filter))
        .or(r.row("serial").downcase().match(filter))
    ).count()
  )
}

dbapi.loadFilteredDevices2 = function (page, count, filter) {
  // console.log("loadDevices")
  filter = filter.toLowerCase()
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  return db.run(
    r.table("devices").filter(
      r.row("model").downcase().match(filter)
        .or(r.row("manufacturer").downcase().match(filter))
        .or(r.row("platform").downcase().match(filter))
        .or(r.row("version").downcase().match(filter))
        .or(r.row("serial").downcase().match(filter))
    )
      .pluck('platform', 'manufacturer', 'serial', 'model', 'version', 'display').skip(skip).limit(limit)
  )
}

dbapi.loadUserGroupCount = function (filter) {
  filter = filter.toLowerCase()
  return db.run(
    r.table("UserGroup").filter(
      function (row) {
        return row('GroupName').downcase().match(filter)
      }
    ).count()
  )
}

dbapi.loadUserGroups = function (page, count, filter) {
  // console.log("UserGroup")
  filter = filter.toLowerCase()
  var skip = parseInt((page - 1) * count);
  var limit = count * 1;
  return db.run(
    r.table("UserGroup").filter(
      function (row) {
        return row('GroupName').downcase().match(filter)
      }
    ).skip(skip).limit(limit)
  )
}
dbapi.loadAllUserGroups = function () {
  return db.run(
    r.table("UserGroup")
  )
}

dbapi.SetUserPassword = function (user, password_md5) {
  return db.run(r.table('UserPasswords').get(user.email).update({
    name: user.name
    , email: user.email
    , password: password_md5
  }))
    .then(function (stats) {
      if (stats.skipped) {
        return db.run(r.table('UserPasswords').insert(
          {
            name: user.name,
            email: user.email,
            password: password_md5
          }
        ))
      }
      return stats
    })
}

dbapi.SetUserPasswordFName = function (user, password_md5) {
  return db.run(r.table('UserPasswords').filter({ 'name': user.name }).update({
    name: user.name
    , email: user.email
    , password: password_md5
  }))
    .then(function (stats) {
      if (stats.skipped) {
        return db.run(r.table('UserPasswords').insert(
          {
            name: user.name,
            email: user.email,
            password: password_md5
          }))
      }
      return stats
    })
}

dbapi.loadUserFName = function (name) {
  return db.run(r.table('users').filter({ 'name': name }))
}

dbapi.loadPassword = function (email) {
  return db.run(r.table('UserPasswords').filter({ 'email': email }))
}


dbapi.loadPasswordFromUser = function (user) {
  return db.run(r.table('UserPasswords').filter(function (row) {
    return row('email').eq(user.email).or(row('name').eq(user.name))
  }))
}

dbapi.ResetPassword = function (email, name) {
  return db.run(r.table('UserPasswords').filter({ 'email': email }).delete()).then(function () {
    db.run(r.table('UserPasswords').filter({ 'name': name }).delete())
  })
}

dbapi.loadPasswordFName = function (name) {
  return db.run(r.table('UserPasswords').filter({ 'name': name }))
}

dbapi.loadGroupFName = function (name) {
  return db.run(r.table('UserGroup').filter({ 'GroupName': name }))
}

dbapi.newGroup = function (name) {
  return db.run(r.table('UserGroup').insert({
    'GroupName': name,
    'userslist': []
  }))
}

dbapi.SetUsersListOfGroup = function (group, userlist) {
  return db.run(r.table('UserGroup').filter({ 'GroupName': group }).update({
    'userslist': userlist
  }))
}

dbapi.SetPermissionOfGroup = function (group, permissionlist) {
  return db.run(r.table('UserGroup').filter({ 'GroupName': group }).update({
    'permissionlist': permissionlist
  }))
}

dbapi.modifyGroup = function (group, new_group) {
  return db.run(r.table('UserGroup').filter({ 'GroupName': group }).update({
    GroupName: new_group
  }))
}

dbapi.deleteGroup = function (group) {
  return db.run(r.table('UserGroup').filter({ 'GroupName': group }).delete())
}

dbapi.synchroProject = function(serial, projectinfo) {
  return db.run(r.table('ProjectInfo').get(serial).update(projectinfo))
  .then(function(stats) {
    if (stats.skipped) {
      //console.log('insert:'+serial)
      return db.run(r.table('ProjectInfo').insert(projectinfo))
    }
    return stats
  })
}

module.exports = dbapi
