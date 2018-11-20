var r = require('rethinkdb')
var util = require('util')
var db = require('./')
var wireutil = require('../wire/util')

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
  return db.run(r.table('users').get(user.email).update({
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

dbapi.loadUser = function (email) {
  return db.run(r.table('users').get(email))
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

dbapi.setDeviceRentConf = function (serial, deivce_rent_config) {
  deivce_rent_config.now = Date.now()
  return db.run(r.table('devices').get(serial).update({
    device_rent_conf: deivce_rent_config
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



dbapi.loadDevices = function () {
  console.log("loadDevices()")
  return db.run(r.table('devices').update({
    device_rent_conf: {
      now: Date.now()
    }
  }
  )
  ).then(function (x) {
    return db.run(r.table('devices'))
  })
}


dbapi.loadPresentDevices = function () {
  console.log("loadPresentDevices()")
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
dbapi.loadDevice = function (serial) {
  console.log("loadDevice(serial)")
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

dbapi.loadProjectsByProjectName = function (projectName) {
  if (!projectName || projectName == "" || projectName == "\"\"") {
    projectName = ""
  }
  return db.run(r.table('ProjectInfo')
    .filter(r.row("ProjectName").match(projectName)).pluck("ProjectCode", "ProjectName").limit(30))

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

dbapi.getLogs = function (condition) {
  if (condition && condition != "") {

    console.log("getLogs condi:" + condition)

    return db.run(
      r.table("DeviceUsingLog").filter(
        function (row) {
          return row("CurrentTime").ge(condition)

        }
      ).orderBy(r.asc("CurrentTime")).limit(50)
    )

  } else {
    return db.run(r.table('DeviceUsingLog').orderBy(r.desc("CurrentTime")).limit(50))
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
          groupby: doc('group'),
          count: doc('reduction').count(),
          SumTimer: doc('reduction').sum('real_rent_time')
        }
      }
    ).skip(skip).limit(limit)
  )
}

dbapi.getStatticsPerDate = function (startdate, enddate, pergroup, page, count, order_by, asc_desc) {
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
    ).ungroup().map(
      function (doc) {
        return {
          groupby: doc('group'),
          count: doc('reduction').count(),
          SumTimer: doc('reduction').sum('real_rent_time')
        }
      }
    ).orderBy(r.asc("groupby")).skip(skip).limit(limit)
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


module.exports = dbapi
