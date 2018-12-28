var r = require('rethinkdb')

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
      { id:'f833de2f-526e-4dbd-b09c-6a24d6bdfe73',GroupName:'administrator',"userslist": [
        {  "email": 'admin@cmbchina.com',  "name":  "admin" }  ]}
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
  }
}
