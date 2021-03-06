var oboe = require('oboe')

module.exports = function DeviceManagerController($scope, $http, NgTableParams) {
  $scope.CurRow = {}
  $scope.deviceFilter = ""
  $scope.serialName = "serial"
  $scope.addSerial = ""
  $scope.addPlatform = "Android"
  $scope.addVersion = "8.0.0"
  $scope.addManufacturer = "HUAWEI"
  $scope.addModel = ""
  $scope.addHeight = ""
  $scope.addWidth = ""
  $scope.curDevices = []
  $scope.isAndroid = true
  $scope.addLocation = "科兴"
  $scope.addProductNo = ""
  $scope.addNotes = ""




  $scope.TypeList = ["Android", "iOS"]
  $scope.ManufactureList = [
    "SAMSUNG",
    "HUAWEI",
    "OPPO",
    "XIAOMI",
    "HTC",
    "Apple",
    "VIVO",
    "MEIZU"
  ]

  $scope.locations = [
    "科兴",
    "研祥",
    "杭州",
    "研发",
    "成都"
  ]

  $scope.AppleModels = [
    "iPhone 3G",
    "iPhone 3GS",
    "iPhone 4",
    "iPhone 4s",
    "iPhone 5",
    "iPhone 5s",
    "iPhone 5c",
    "iPhone 6",
    "iPhone 6 Plus",
    "iPhone 6s",
    "iPhone 6s Plus",
    "iPhone 7",
    "iPhone 7 Plus",
    "iPhone 8",
    "iPhone 8 Plus",
    "iPhone X",
    "iPhone XS",
    "iPhone XS Max",
    "iPhone XR",
    "Others",
  ]

  $scope.changePlatform = function () {
    console.log("platform changed:" + $scope.addPlatform)
    if ($scope.addPlatform == "Android") {
      $scope.serialName = "serial"
      $scope.isAndroid = true
      $scope.addVersion = "8.0.0"
      $scope.addModel = ""
      $scope.addManufacturer = "HUAWEI"
      $scope.ManufactureList = [
        "SAMSUNG",
        "HUAWEI",
        "OPPO",
        "XIAOMI",
        "HTC",
        "VIVO",
        "MEIZU",
      ]
      // $scope.$apply()
    } else {
      $scope.serialName = "serial(UDID)"
      $scope.isAndroid = false
      $scope.addVersion = "11.3"
      $scope.addManufacturer = "Apple"
      $scope.ManufactureList = [
        "Apple",
      ]
      $scope.addModel = "iPhone X"
      // $scope.$apply()
    }


  }



  $scope.SelectDevice = function (row) {
    if (row.selected == true) row.selected = false
    else row.selected = true

    $scope.tableParamsDevices.data.forEach(e => {
      e.selected = false
    })
    //    row.checked = true
    if (row.selected == true) {
      row.selected = false
      $scope.CurRow = {}
    }
    else {
      $scope.CurRow = row
      row.selected = true

      $scope.addPlatform = row.platform
      $scope.changePlatform()
      $scope.addSerial = row.serial
      $scope.addVersion = row.version
      $scope.addManufacturer = row.manufacturer
      $scope.addModel = row.model

      var xy = row.display.toLowerCase()
      var x = xy.substr(0, xy.indexOf('x'))
      var y = xy.substr(xy.indexOf('x') + 1)
      $scope.addHeight = x
      $scope.addWidth = y
      $scope.addProductNo = row.productNo
      $scope.addLocation = row.deviceLocation
      $scope.addNotes = row.notes
      console.log("click:" + JSON.stringify(row))

    }

  }

  $scope.deleteOneDevice = function (serial) {
    var data = {
      serial: serial
    }
    return new Promise(function (resolve, reject) {
      $http.post('/auth/api/v1/mock/delete-device', data)
        .success(function (response) {
          //    console.log("success:" + JSON.stringify(response))
          $scope.freshDevice()
          return resolve(response.data)
        })
        .error(function (response) {
          console.log("fail")
          return reject(response.error)
        })
    });
  }

  $scope.deleteDevices = function () {
    var list = []
    $scope.tableParamsDevices.data.forEach(element => {
      if (element.selected == true) {
        delete element.selected;
        $scope.deleteOneDevice(element.serial)
      }
    })
  }

  $scope.addDevice = function () {
    if ($scope.addSerial.trim() == "") {
      alert("Serial不能为空！")
      return
    }
    if ($scope.addModel.trim() == "") {
      alert("型号不能为空！")
      return
    }
    if ($scope.addHeight.trim() == "" || isNaN($scope.addHeight)) {
      alert("屏幕高不能为空且只能为数字")
      return
    }
    if ($scope.addWidth.trim() == "" || isNaN($scope.addWidth)) {
      alert("屏幕宽不能为空且只能为数字！")
      return
    }
    if ($scope.addProductNo.trim() == "") {
      alert("测试中心设备编号不能为空！")
      return
    }
    var data = {
      serial: $scope.addSerial,
      platform: $scope.addPlatform,
      version: $scope.addVersion,
      manufacturer: $scope.addManufacturer,
      model: $scope.addModel,
      display: {
        height: $scope.addHeight,
        width: $scope.addWidth
      },
      productNo: $scope.addProductNo,
      deviceLocation: $scope.addLocation,
      notes: $scope.addNotes
    }
    return new Promise(function (resolve, reject) {
      $http.post('/auth/api/v1/mock/add-device', data)
        .success(function (response) {
          //    console.log("success:" + JSON.stringify(response))
          $scope.freshDevice()
          return resolve(response.data)
        })
        .error(function (response) {
          console.log("fail")
          return reject(response.error)
        })
    });

  }

  // 设备管理

  $scope.getFilteredDevices = function (page, count, filter) {
    var data = {
      page: page
      , count: count
      , filter: filter
    }
    return new Promise(function (resolve, reject) {
      $http.post('/auth/api/v1/mock/get-filtered-devices-2', data)
        .success(function (response) {
          console.log("success" + JSON.stringify(response.data))
          return resolve(response.data)
        })
        .error(function (response) {
          console.log("fail")
          return reject(response.data)
        })

    });
  }

  $scope.QueryDevices = function (params) {
    var filter = $scope.deviceFilter
    //  console.log("device filter:" + $scope.deviceFilter)
    var count = params.parameters().count
    var page = params.parameters().page
    //  console.log("count:" + count)
    //  console.log("page:" + page)
    return $scope.getFilteredDevices(page, count, filter).then(function (data) {
      var ret = data
      params.total(ret.total)
      //    console.log("all page count:" + ret.total)
      //    console.log("recv count:" + ret.datasets.length)
      $scope.pagesDeviceCount = Math.ceil($scope.tableParamsDevices.total() / $scope.tableParamsDevices.parameters().count)
      ret.datasets.forEach(ele => {
        if (!ele.productNo) {
          ele.productNo = "NULL"
        } else {
          var tmp = ele.productNo
          delete ele.productNo
          ele.productNo = tmp
        }
        var width = ele.display.width
        var height = ele.display.height
        ele.display = "" + height + "X" + width
      });
      return ret.datasets
    })
    // .catch(function (err) {
    //     console.log("err:" + JSON.stringify(err))
    // })
  }

  function jsonSort(jsonObj) {
    let arr = [];
    for (var key in jsonObj) {
      arr.push(key)
    }
    arr.sort();
    let str = '';
    for (var i in arr) {
      var tmp = jsonObj[i]
      delete jsonObj[i]
      jsonObj[i] = tmp
    }
    return jsonObj
  }

  $scope.tableParamsDevices = new NgTableParams(
    { count: 15 },
    {
      counts: [5, 10, 15, 30, 50],
      getData: $scope.QueryDevices
    }
  )

  $scope.freshDevice = function () {
    try {
      console.log("Fresh Devices By Filter: " + $scope.deviceFilter)
      $scope.tableParamsDevices.reload()
    } catch (e) {
      console.log("[Error] $scope.tableParamsDevices.reload()");
    }
  }


}
