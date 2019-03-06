var r = require('rethinkdb')
var wireutil = require('../wire/util')

module.exports = {
  users: {
    primaryKey: 'email'
    , indexes: {
      adbKeys: {
        indexFunction: function (user) {
          return user('adbKeys')('fingerprint')
        }
        , options: {
          multi: true
        }
      }
    }
    , defaultData: [
      {
        "email": 'admin@cmbchina.com', "name": "admin"
        , "ip": "::ffff:127.0.0.1"
        , group: wireutil.makePrivateChannel()
        , lastLoggedInAt: r.now()
        , createdAt: r.now()
        , forwards: []
        , settings: {}
      }
    ]
  }
  , accessTokens: {
    primaryKey: 'id'
    , indexes: {
      email: null
    }
  }
  , vncauth: {
    primaryKey: 'password'
    , indexes: {
      response: null
      , responsePerDevice: {
        indexFunction: function (row) {
          return [row('response'), row('deviceId')]
        }
      }
    }
  }
  , devices: {
    primaryKey: 'serial'
    , indexes: {
      owner: {
        indexFunction: function (device) {
          return r.branch(
            device('present')
            , device('owner')('email')
            , r.literal()
          )
        }
      }
      , present: null
      , providerChannel: {
        indexFunction: function (device) {
          return device('provider')('channel')
        }
      }
    }
  }
  , logs: {
    primaryKey: 'id'
  }
  , ProjectInfo: {
    primaryKey: 'ProjectId'
    , indexes: {
      ProjectCodeName: {
        indexFunction: function (row) {
          return [row('ProjectCode'), row('ProjectName')]
        }
      }
    }
  }
  , DeviceUsingLog: {
    primaryKey: 'rentId'
    , indexes: {
      LogTime: {
        indexFunction: function (row) {
          return [
            row('seraial')
            , row('start_time')
            , row('CurrentTime')
          ]
        }
      }
      , DeviceUser: {
        indexFunction: function (row) {
          return [
            row('owner_email')
            , row('owner_name')
          ]
        }
      }
      , DeviceProjectCode: {
        indexFunction: function (row) {
          return [row('ProjectCode'), row('ProjectName')]
        }
      }
    }
  }
  , ProgressBar: {
    primaryKey: 'id'
    , indexes: {
      ProgressBarName: {
        indexFunction: function (row) {
          return [row('name'), row('user')]
        }
      }
    }
  }
  , UserPasswords: {
    primaryKey: 'id'
    , indexes: {
      UserPasswordsName: {
        indexFunction: function (row) {
          return [row('email'), row('password')]
        }
      }
    }
  }
  , UserGroup: {
    primaryKey: 'id'
    , indexes: {
      UserGroup: {
        indexFunction: function (row) {
          return [row('GroupName')]
        }
      }
    }
    , defaultData: [
      {
        id: 'f833de2f-526e-4dbd-b09c-6a24d6bdfe73', GroupName: 'administrator', "userslist": [
          {
            "NameCN":  "管理员" ,  "email": 'admin@cmbchina.com', "name": "admin"
          }]
      },
      {
        id: 'f08a3e8a-6014-4beb-86d2-25c719eb482f', GroupName: 'tester', "userslist": [
          ]
      },
      {
        id: '789600ad-6ebf-4d7d-af23-469326948ed2', GroupName: 'developer', "userslist": [
          ]
      }
      ,
      {
        id: '11a59d35-0d2e-4017-a8ae-670143fbd949', GroupName: '自动化测试组', "userslist": [
          ]
      }
      ,
      {
        id: '76fc41b7-f696-4b77-a1be-3d2bf61487a0', GroupName: '项目占用组', "userslist": [
          ]
      }
    ]
  }
  , DeviceGroups: {
    primaryKey: 'name'
    , indexes: {
      DeviceGroupsName: {
        indexFunction: function (row) {
          return [row('users')('userName')]
        }
      }
    }
  }
  ,CompatResult: {
    primaryKey: 'id'
    , indexes: {
      DeviceGroupsName: {
        indexFunction: function (row) {
          return [row('data')]
        }
      }
    }
  },
  PermissionTable: {
    primaryKey: 'PermissionId'
    , indexes: {
      PermissionName: {
        indexFunction: function (row) {
          return [row('PermissionName')]
        }
      }
    }
    , defaultData: [
      { PermissionId: "335e7c9c-3819-4fd5-b989-65e0a682970e", desc: "data synchronization permission", name: "数据同步" },
      { PermissionId: "551281ad-d3ed-41d5-a2d7-9a18bb891c6f", desc: "user group management", name: "用户管理" },
      { PermissionId: "8e1d13b6-48f2-413c-aae1-03c244b11210", desc: "equipment group management", name: "设备组管理" },
      { PermissionId: "88ca3d8d-d989-4a6e-be8d-dc8d358bfa99", desc: "manual addition of equipment", name: "设备添加删除" }
    ]
  }
, ProjectInfo:  {
    primaryKey:'ProjectId'
  }
}
