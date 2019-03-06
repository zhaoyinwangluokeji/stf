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
    },
    {
      name: '设备统计'
      , selected: true
      , admin: false
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
    ,{
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
          , selected: true
        }
        , {
          name: 'owner_group'
          , selected: false
        }
        , {
          name: 'owner_name'
          , selected: false
        }

        , {
          name: 'ProjectCode'
          , selected: false
        }
        , {
          name: 'ProjectName'
          , selected: false
        }
        , {
          name: 'real_rent_time'
          , selected: true
        }
        , {
          name: 'rent_time'
          , selected: false
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
        , selected: true
      }
      , {
        name: 'owner_group'
        , selected: false
      }
      , {
        name: 'owner_name'
        , selected: false
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
        , selected: true
      }
      , {
        name: 'rent_time'
        , selected: false
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
        name: 'serial'
        , order: 'desc'
      }

    ]
    , user: [
      {
        name: 'desc'
        , order: 'asc'
      }
      ,
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
        name: 'CurrentTime'
        , order: 'asc'
      },
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
    console.log('toggle  ')
    if (device.using) {
      $scope.kick(device)
    } else {
      $location.path('/control/' + device.serial)
    }
  }

  $scope.invite = function (device) {
    console.log('invite  ')
    return GroupService.invite(device).then(function () {
      $scope.$digest()
    })
  }

  $scope.applyFilter = function (query) {
    console.log('applyFilter : ' + query)
    $scope.filter = QueryParser.parse(query)
    console.log('applyFilter result : ' + JSON.stringify($scope.filter))
  }


  $scope.search = {
    deviceFilter: '',
    focusElement: false
  }

  $scope.focusSearch = function () {
    if (!$scope.basicMode) {
      $scope.search.focusElement = true
    }
  }

  $scope.reset = function () {
    console.log('reset  ')
    $scope.search.deviceFilter = ''
    $scope.filter = []
    $scope.sort = defaultSort
    $scope.columns = defaultColumns
  }

  $scope.LogReset = function () {
    console.log('reset2  ')
    $scope.search.deviceFilter = ''
    $scope.filter = []
    $scope.Logssort = defaultLogsSort
    $scope.logsColumns = defaultLogsColumns()
  }

  $scope.dat = new Date();
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
  $scope.dateOptions = {
    //  customClass: getdayclass,//自定义类名
    //  dateDisabled: false//是否禁用
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
      console.log("load to:" + JSON.stringify(data))
    })
  }

  $scope.condi = ""
  $scope.enterSomething = function ($event) {
    if ($event.keyCode == 13) {//回车
      console.log('enterSomething:' + $scope.search.deviceFilter)
      $scope.condi = $scope.search.deviceFilter
    }
  }
  SettingsService.bind($scope, {
    target: 'dat'
    , source: 'deviceListdat'
  })
  SettingsService.bind($scope, {
    target: 'condi'
    , source: 'deviceListcondi'
  })

  $scope.$watch('dat', function (newValue, oldValue) {
    console.log("dat:" + $scope.dat)
    console.log("Newdat:" + newValue)
    $scope.LogsCondition = newValue;
    // getLogs();
  });

  $scope.$watch('condi', function (newValue, oldValue) {
    console.log("condi:" + $scope.condi)
    console.log("Newcondi:" + newValue)

  });



}
