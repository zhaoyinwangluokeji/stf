var oboe = require('oboe')
var _ = require('lodash')
var EventEmitter = require('eventemitter3')

module.exports = function DeviceServiceFactory($http, socket, EnhanceDeviceService, DeviceRentWebControl, AppState) {
  var deviceService = {}

  function Tracker($scope, options) {
    var devices = []
    var devicesBySerial = Object.create(null)
    var scopedSocket = socket.scoped($scope)
    var digestTimer, lastDigest
    $scope.device_groups = null
    $scope.user_groups = null
    $scope.in_groups = []
    var usable_devices_lists = []
    $scope.is_admin = false
    var show_device_serials = []

    function getAllDeviceGroups() {
      return new Promise(function (resolve, reject) {
        data = {}
        $http.post('/auth/api/v1/mock/get-all-device-groups', data)
          .success(function (response) {
            $scope.device_groups = response.data
          //  console.log("success: " + JSON.stringify(response.data))
            return resolve(response.data)
          })
          .error(function (response) {
            console.log("fail")
            return reject(response.data)
          })
      });
    }

    function getAllUserGroups() {
      return new Promise(function (resolve, reject) {
        data = {}
        $http.post('/auth/api/v1/mock/get-all-user-groups', data)
          .success(function (response) {
            $scope.user_groups = response.data
          //  console.log("success: " + JSON.stringify(response.data))
            return resolve(response.data)
          })
          .error(function (response) {
            console.log("fail")
            return reject(response.data)
          })
      });
    }

    console.log("new Tracker() ")
    $scope.$on('$destroy', function () {
      console.log("Tracker destroy")
      clearTimeout(digestTimer)
    })
    DeviceRentWebControl.set($scope);
    function digest() {
      // Not great. Consider something else
      if (!$scope.$$phase) {
        $scope.$digest()
      }

      lastDigest = Date.now()
      digestTimer = null
    }

    function notify(event) {
      if (!options.digest) {
        return
      }

      if (event.important) {
        // Handle important updates immediately.
        //digest()
        window.requestAnimationFrame(digest)
      }
      else {
        if (!digestTimer) {
          var delta = Date.now() - lastDigest
          if (delta > 1000) {
            // It's been a while since the last update, so let's just update
            // right now even though it's low priority.
            digest()
          }
          else {
            // It hasn't been long since the last update. Let's wait for a
            // while so that the UI doesn't get stressed out.
            digestTimer = setTimeout(digest, delta)
          }
        }
      }
    }

    function sync(data) {
      // usable IF device is physically present AND device is online AND
      // preparations are ready AND the device has no owner or we are the
      // owner
      data.usable = data.present && data.status === 3 && data.ready &&
        (!data.owner || data.using)

      // Make sure we don't mistakenly think we still have the device
      if (!data.usable || !data.owner) {
        data.using = false
      }

      EnhanceDeviceService.enhance(data)
    }

    function get(data) {
      return devices[devicesBySerial[data.serial]]
    }

    var insert = function insert(data) {
      console.log("insert ")
      // devicesBySerial[data.serial] = devices.push(data) - 1
      // sync(data)
      // console.log("pushing device serial:  " + data.serial)
      show_device_serials.push(data.serial)
      this.emit('add', data)
    }.bind(this)

    var modify = function modify(data, newData) {
      _.merge(data, newData, function (a, b) {
        // New Arrays overwrite old Arrays
        if (_.isArray(b)) {
          return b
        }
      })

      sync(data)
      //  console.log("emit change :"+JSON.stringify(data.device_rent_conf))
      this.emit('change', data)
    }.bind(this)

    var remove = function remove(data) {
      console.log("remove ")
      var index = devicesBySerial[data.serial]
      if (index >= 0) {
        devices.splice(index, 1)
        delete devicesBySerial[data.serial]
        this.emit('remove', data)
      }
    }.bind(this)

    function fetch(data) {
      console.log("fetch " + data.serial)
      return deviceService.load(data.serial)
        .then(function (device) {
          return changeListener({
            important: true
            , data: device
          })
        })
        .catch(function () { })
    }

    function MergeArray(arr1, arr2) {
      var _arr = new Array();
      for (var i = 0; i < arr1.length; i++) {
        _arr.push(arr1[i]);
      }
      for (var i = 0; i < arr2.length; i++) {
        var flag = true;
        for (var j = 0; j < arr1.length; j++) {
          if (arr2[i] == arr1[j]) {
            flag = false;
            break;
          }
        }
        if (flag) {
          _arr.push(arr2[i]);
        }
      }
      return _arr;
    }

    function getAllUsableDevices(serial) {
      var email = AppState.user.email
      console.log("loading all device groups ...")
      return getAllDeviceGroups().then(function () {
        console.log("loading all user groups ...")
        return getAllUserGroups()
      }).then(function () {
      //  console.log("Got User Groups: " + JSON.stringify($scope.user_groups))
        $scope.user_groups.forEach(ele => {
          if (ele.userslist) {
            ele.userslist.forEach(element => {
              if (element.email == email) {
                if(ele.GroupName == "administrator"){
                  console.log("user is Admin!!")
                  $scope.is_admin = true
                }
                $scope.in_groups.push(ele.GroupName)
              }
            });
          }
        });

        $scope.device_groups.forEach(ele => {
          $scope.in_groups.forEach(element => {
            if (ele.usergroups.indexOf(element) > -1) {
              usable_devices_lists = MergeArray(usable_devices_lists, ele.devices)
              // console.log("usable device lists: " + JSON.stringify(usable_devices_lists))
              return
            }
          });
        });
      })
    }

    function ifDeviceUsable(serial) {
      if (usable_devices_lists.indexOf(serial) > -1) {
        return true
      } else {
        return false
      }
    }

    function handleAddListener(event, isNew, device) {
      if (!isNew) {
        modify(device, event.data)
        notify(event)
        DeviceRentWebControl.open(device, modify, fetch)
      }
      else {
        if (options.filter(event.data)) {
          insert(event.data)
          notify(event)
          device = get(event.data)
          DeviceRentWebControl.open(device, modify, fetch)
        }
      }
    }

    function addListener(event) {
      //  console.log("addListener ")
      var device = get(event.data)
      var isNew = true
      if (device) {
        var isNew = false
      } else {
        devicesBySerial[event.data.serial] = devices.push(event.data) - 1
        sync(event.data)
        device = get(event.data)
      }

      if (event.checkPermition) {
        return (new Promise(function (resolve) {
          if ($scope.device_groups == null || $scope.user_groups == null) {
            console.log("initializing device group and user group...")
            return resolve(getAllUsableDevices())
          } else {
            return resolve()
          }
        })).then(function () {
          if (!$scope.is_admin && !ifDeviceUsable(event.data.serial)) {
            // console.log("device is not permitted for user, usable devices:  " + JSON.stringify(usable_devices_lists))
            return
          } else {
            // console.log("device is ready for user, usable devices:  " + JSON.stringify(usable_devices_lists))
            handleAddListener(event,isNew,device)
          }
        })
      } else {
        // console.log("Adding Device and not checking permition ")
        handleAddListener(event, isNew, device)
      }
    }

    var changeListener = function(event) {
      var device = get(event.data)

      if (device) {
        // console.log("changeListener1 " + event.data.serial)
        modify(device, event.data)
        // console.log("data:" + JSON.stringify(event.data))
        if (!options.filter(device)) {
          console.log("remove device " + event.data.serial)
          remove(device)
        }
        notify(event)
        DeviceRentWebControl.open(device, modify, fetch)
      }
      else {
        if (options.filter(event.data)) {
          // console.log("changeListener2 " + event.data.serial)
          devicesBySerial[event.data.serial] = devices.push(event.data) - 1
          sync(event.data)
          device = get(event.data)
          // console.log("data:" + JSON.stringify(event.data))
          insert(event.data)
          // We've only got partial data
          fetch(event.data)
          notify(event)
          device = get(event.data)
          DeviceRentWebControl.open(device, modify, fetch)

        }
      }
    }.bind(this)

    scopedSocket.on('device.add', addListener)
    scopedSocket.on('device.remove', changeListener)
    scopedSocket.on('device.change', changeListener)

    this.add = function (device, checkPermition) {
      addListener({
        important: true
        , data: device
        , checkPermition: checkPermition
      })
    }
    this.devices = devices
    this.show_device_serials = show_device_serials
    this.getUsableList = function(){
      return usable_devices_lists
    }
    this.get = function(serial){
      return devices[devicesBySerial[serial]]
    }
    this.getIfAdmin = function(){
      return $scope.is_admin
    }
  }

  Tracker.prototype = new EventEmitter()

  deviceService.trackAll = function ($scope) {
    var tracker = new Tracker($scope, {
      filter: function () {
        return true
      }
      , digest: false
    })

    oboe('/api/v1/devices')
      .node('devices[*]', function (device) {
        tracker.add(device, true)
      })

    return tracker
  }

  deviceService.trackGroup = function ($scope) {
    var tracker = new Tracker($scope, {
      filter: function (device) {
        return device.using
      }
      , digest: true
    })

    oboe('/api/v1/user/devices')
      .node('devices[*]', function (device) {
        tracker.add(device, false)
      })

    return tracker
  }

  deviceService.load = function (serial) {
    return $http.get('/api/v1/devices/' + serial)
      .then(function (response) {
        return response.data.device
      })
  }

  deviceService.get = function (serial, $scope) {
    var tracker = new Tracker($scope, {
      filter: function (device) {
        return device.serial === serial
      }
      , digest: true
    })

    return deviceService.load(serial)
      .then(function (device) {
        tracker.add(device)
        return device
      })
  }

  deviceService.updateNote = function (serial, note) {
    socket.emit('device.note', {
      serial: serial,
      note: note
    })
  }

  deviceService.updateMaintain = function (serial, maintain) {
    socket.emit('device.maintain', {
      serial: serial,
      maintain: maintain
    })
  }

  return deviceService
}
