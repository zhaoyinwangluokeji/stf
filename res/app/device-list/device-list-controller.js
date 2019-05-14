var QueryParser = require('./util/query-parser')
//require('./datepicker-ui-bootstrap/Content/bootstrap.css')
//require('./datepicker-ui-bootstrap/Scripts/ui-bootstrap-tpls-1.3.2.js')
require('./datepicker-ui-bootstrap/Scripts/angular-locale_zh-cn.js')
//require('./datepicker-ui-bootstrap/Scripts/angular.js')

module.exports = function DeviceListCtrl(
  $scope
  , DeviceService
  , DeviceColumnService
  , GroupService
  , ControlService
  , SettingsService
  , $location
  , LogColumnService
  , DeviceRentLogService
  , DevUsingStatisticsFactory
  , AppState
) {
  console.log('DeviceListCtrl  ')
  $scope.tracker = DeviceService.trackAll($scope)
  $scope.control = ControlService.create($scope.tracker.devices, '*ALL')

  $scope.columnDefinitions = DeviceColumnService
  $scope.LogscolumnDefinitions = LogColumnService

  var MenusDefault = [
    {
      name: '设备租用日志统计'
      , selected: true
      , admin: false
      , click: DeviceUsingStatistics
      , parameter: 'Msg'
    }
  ]


  $scope.Menus = MenusDefault

  var defaultColumns = [
    {
      name: 'state'
      , selected: true
    },
    {
      name: 'rent'
      , selected: true
    }
    ,
    {
      name: 'RentRlease'
      , selected: true
    },
    {
      name: 'owner'
      , selected: true
    },
    {
      name: 'manufacturer'
      , selected: true
    }
    , {
      name: 'model'
      , selected: true
    }
    , {
      name: 'name'
      , selected: false
    }
    , {
      name: 'serial'
      , selected: true
    }
    , {
      name: 'createdAt'
      , selected: false
    }
    , {
      name: 'deviceType'
      , selected: true
    }
    , {
      name: 'operator'
      , selected: false
    }
    , {
      name: 'releasedAt'
      , selected: false
    }
    , {
      name: 'version'
      , selected: true
    }
    , {
      name: 'network'
      , selected: false
    }
    , {
      name: 'display'
      , selected: true
    },
    {
      name: 'rentProject'
      , selected: true
    }
    , {
      name: 'sdk'
      , selected: false
    }
    , {
      name: 'productNo'
      , selected: false
    }
    , {
      name: 'deviceLocation'
      , selected: false
    }
    , {
      name: 'abi'
      , selected: false
    }
    , {
      name: 'cpuPlatform'
      , selected: false
    }
    , {
      name: 'openGLESVersion'
      , selected: false
    }
    , {
      name: 'browser'
      , selected: false
    }
    , {
      name: 'phone'
      , selected: false
    }
    , {
      name: 'imei'
      , selected: false
    }
    , {
      name: 'imsi'
      , selected: false
    }
    , {
      name: 'iccid'
      , selected: false
    }
    , {
      name: 'batteryHealth'
      , selected: false
    }
    , {
      name: 'batterySource'
      , selected: false
    }
    , {
      name: 'batteryStatus'
      , selected: false
    }
    , {
      name: 'batteryLevel'
      , selected: false
    }
    , {
      name: 'batteryTemp'
      , selected: false
    }
    // , {
    //   name: 'provider'
    //   , selected: false
    // }
    , {
      name: 'notes'
      , selected: false
    }
    , {
      name: 'maintain'
      , selected: false
    }
    , {
      name: 'back'
      , selected: true
    }
  ]

  $scope.columns = defaultColumns
  var defaultLogsColumns = (function () {
    var cols =
      [
        {
          name: 'manufacturer'
          , selected: true
        }
        , {
          name: 'CurrentTime'
          , selected: true
        }
        , {
          name: 'serial'
          , selected: true
        }
        ,
        {
          name: 'model'
          , selected: false
        }
        ,
        {
          name: 'platform'
          , selected: false
        }
        , {
          name: 'version'
          , selected: false
        }
        ,
        {
          name: 'owner_email'
          , selected: false
        }
        , {
          name: 'owner_group'
          , selected: false
        }
        , {
          name: 'owner_name'
          , selected: true
        }

        , {
          name: 'ProjectCode'
          , selected: false
        }
        , {
          name: 'ProjectName'
          , selected: true
        }
        , {
          name: 'real_rent_time'
          , selected: false
        }
        , {
          name: 'rent_time'
          , selected: false
        }
        , {
          name: 'using_time'
          , selected: true
        }
        , {
          name: 'start_time'
          , selected: false
        }
        , {
          name: 'test_centerCode'
          , selected: false
        }, {
          name: 'device_type'
          , selected: false
        }
        , {
          name: 'mac_address'
          , selected: false
        }

      ]
    return cols;

  })
  var LogsColumns =
    [
      {
        name: 'manufacturer'
        , selected: true
      }
      , {
        name: 'CurrentTime'
        , selected: true
      }
      , {
        name: 'serial'
        , selected: true
      }
      ,
      {
        name: 'model'
        , selected: false
      }
      ,
      {
        name: 'platform'
        , selected: false
      }
      , {
        name: 'version'
        , selected: false
      }

      ,
      {
        name: 'owner_email'
        , selected: false
      }
      , {
        name: 'owner_group'
        , selected: false
      }
      , {
        name: 'owner_name'
        , selected: true
      }

      , {
        name: 'ProjectCode'
        , selected: false
      }
      , {
        name: 'ProjectName'
        , selected: true
      }
      , {
        name: 'real_rent_time'
        , selected: false
      }
      , {
        name: 'rent_time'
        , selected: false
      }
      , {
        name: 'using_time'
        , selected: true
      }
      , {
        name: 'start_time'
        , selected: false
      }
      , {
        name: 'test_centerCode'
        , selected: false
      }, {
        name: 'device_type'
        , selected: false
      }
      , {
        name: 'mac_address'
        , selected: false
      }

    ]
  $scope.logsColumns = LogsColumns

  function DeviceUsingStatistics() {
    DevUsingStatisticsFactory.open($scope.logsColumns)

  }

  SettingsService.bind($scope, {
    target: 'columns'
    , source: 'deviceListColumns'
  })

  var defaultSort = {
    fixed: [
      {
        name: 'state'
        , order: 'asc'
      }
    ]
    , user: [
      {
        name: 'name'
        , order: 'asc'
      }
    ]
  }
  var defaultLogsSort = {
    fixed: [

      {
        name: 'CurrentTime'
        , order: 'asc'
      },
      {
        name: 'serial'
        , order: 'desc'
      }

    ]
    , user: [
      {
        name: 'ProjectCode'
        , order: 'asc'
      }
      ,
      {
        name: 'ProjectName'
        , order: 'asc'
      }

      ,
      {
        name: 'platform'
        , order: 'asc'
      }
      ,
      {
        name: 'real_rent_time'
        , order: 'asc'
      }
      ,
      {
        name: 'version'
        , order: 'asc'
      }
    ]
  }

  $scope.sort = defaultSort
  $scope.Logssort = defaultLogsSort


  SettingsService.bind($scope, {
    target: 'sort'
    , source: 'deviceListSort'
  })

  $scope.filter = []

  $scope.activeTabs = {
    icons: true
    , details: false
    , deviceusinglog: false
    , usingstatics: false
  }

  SettingsService.bind($scope, {
    target: 'activeTabs'
    , source: 'deviceListActiveTabs'
  })

  $scope.toggle = function (device) {
    if (device.using) {
      $scope.kick(device)
    } else {
      $location.path('/control/' + device.serial)
    }
  }

  $scope.invite = function (device) {
    return GroupService.invite(device).then(function () {
      $scope.$digest()
    })
  }

  $scope.applyFilter = function (query) {
    $scope.filter = QueryParser.parse(query)
  }


  $scope.search = {
    deviceFilter: '',
    deviceFilter1: '',
    focusElement: false
  }

  $scope.focusSearch = function () {
    if (!$scope.basicMode) {
      $scope.search.focusElement = true
    }
  }

  $scope.reset = function () {
    $scope.search.deviceFilter = ''
    $scope.filter = []
    $scope.sort = defaultSort
    $scope.columns = defaultColumns
  }

  $scope.LogReset = function () {
    $scope.search.deviceFilter1 = ''
    $scope.filter = []
    $scope.Logssort = defaultLogsSort
    $scope.logsColumns = defaultLogsColumns()
  }

  $scope.dat = new Date();
  $scope.datend = new Date();
  /*
    $scope.format=['dd-MMMM-yyyy','yyyy-MM-dd', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate']
    $scope.altInputFormats=['yyyy-M!-d!','yyyy/M!/d!','yyyy.M!.d!','yyyy M! d!'];
  */
  $scope.format = "yyyy/MM/dd";
  $scope.altInputFormats = ['yyyy/M!/d!'];

  $scope.popup1 = {
    opened: false
  };
  $scope.open1 = function () {
    $scope.popup1.opened = true;
  };
  $scope.popup2 = {
    opened: false
  };
  $scope.open2 = function () {
    $scope.popup2.opened = true;
  };
  $scope.dateOptions = {
    //  customClass: getdayclass,//自定义类名
    //  dateDisabled: false//是否禁用
  }
  $scope.dateOptions2 = {
    //  customClass: getdayclass,//自定义类名
    //  dateDisabled: true//是否禁用
  }

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var afterTomorrow = new Date();
  afterTomorrow.setDate(tomorrow.getDate() + 1);
  $scope.events = [
    {
      date: tomorrow,
      status: 'full'
    },
    {
      date: afterTomorrow,
      status: 'partially'
    }
  ];
  //为日期面板中的每个日期（默认42个）返回类名。传入参数为{date: obj1, mode: obj2}
  $scope.getdayclass = function (obj) {
    var date = obj.date,
      mode = obj.mode;
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }
    return '';
  }
  //设置日期面板中的所有周六和周日不可选
  $scope.isdisabled = function (obj) {
    var date = obj.date,
      mode = obj.mode;
    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  }

  function getLogs() {
    DeviceRentLogService.getLogs('', '', '', 50, '', '').then(function (data) {
      $scope.Logs = data;
    })
  }

  $scope.condi = ""
  $scope.enterSomething = function ($event, value) {
    if ($event.keyCode == 13) {//回车
      console.log("enterSomething:" + value)
      $scope.condi = value
    }
  }
  /*
  SettingsService.bind($scope, {
    target: 'dat'
    , source: 'deviceListdat'
  })
  SettingsService.bind($scope, {
    target: 'datend'
    , source: 'deviceListdat_end'
  })*/
  SettingsService.bind($scope, {
    target: 'condi'
    , source: 'deviceListcondi'
  })
  $scope.$watch('dat', function (newValue, oldValue) {
    if (newValue > $scope.datend) {
      alert("开始必须小于结束时间")
      $scope.dat = oldValue;
    }
  });
  $scope.$watch('datend', function (newValue, oldValue) {
    if (newValue < $scope.dat) {
      alert("结束时间必须大于开始时间")
      $scope.datend = oldValue;
    }
  });
  $scope.$watch('logsColumns', function (newValue, oldValue) {
  }, true);
  $scope.$watch('condi', function (newValue, oldValue) {
    console.log("condi:" + $scope.condi)
    console.log("Newcondi:" + newValue)
  }, true);

}
