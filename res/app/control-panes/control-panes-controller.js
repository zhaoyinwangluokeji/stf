module.exports =
  function ControlPanesController($scope, $http, gettext, $routeParams,
    $timeout, $location, DeviceService, GroupService, ControlService,
    StorageService, FatalMessageService, SettingsService, AppState) {



    var sharedTabs = [
      {
        title: gettext('截图'),
        icon: 'fa-camera color-skyblue',
        templateUrl: 'control-panes/screenshots/screenshots.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('深度遍历'),
        icon: 'fa-info color-orange',
        templateUrl: 'control-panes/crawler/crawler.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('元素定位工具'),
        icon: 'fa-camera color-skyblue color-blue',
        templateUrl: 'control-panes/uiautomatorviewer/uiautomatorviewer.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('设置'),
        icon: 'fa-road color-lila',
        templateUrl: 'control-panes/automation/automation.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('高级'),
        icon: 'fa-bolt color-brown',
        templateUrl: 'control-panes/advanced/advanced.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('文件浏览'),
        icon: 'fa-folder-open color-blue',
        templateUrl: 'control-panes/explorer/explorer.pug',
        filters: ['native', 'web']
      },
      {
        title: gettext('信息统计'),
        icon: 'fa-info color-orange',
        templateUrl: 'control-panes/info/info.pug',
        filters: ['native', 'web']
      }
    ]

    $scope.topTabs = [
      {
        title: gettext('Dashboard'),
        icon: 'fa-dashboard fa-fw color-pink',
        templateUrl: 'control-panes/dashboard/dashboard.pug',
        filters: ['native', 'web']
      }
    ].concat(angular.copy(sharedTabs))

    $scope.belowTabs = [
      {
        title: gettext('Logs'),
        icon: 'fa-list-alt color-red',
        templateUrl: 'control-panes/logs/logs.pug',
        filters: ['native', 'web']
      }
    ].concat(angular.copy(sharedTabs))

    $scope.device = null
    $scope.control = null

    // TODO: Move this out to Ctrl.resolve
    function getDevice(serial) {
      return new Promise((resolve, reject) => {
        return DeviceService.get(serial, $scope)
          .then(function (device) {
            if (device.device_rent_conf &&
              device.device_rent_conf.rent) {
              if (device.device_rent_conf.owner &&
                AppState.user.email == device.device_rent_conf.owner.email &&
                AppState.user.name == device.device_rent_conf.owner.name) {
                $scope.device = device
                $scope.control = ControlService.create(device, device.channel)
                return device
              } else {
                var alarm = '设备已经被其他人申请使用，请租用其他设备'
                alert(alarm)
                reject(alarm);
                return (new Promise((reso, rej) => { rej('1231') }));
              }
            }
            else {
              var alarm = '设备没有租用，请进入租用界面进行租用'
              alert(alarm)
              reject(alarm);
              return (new Promise((reso, rej) => { rej('3333') }));
            }
          })
          .then(function (device) {
            console.log("GroupService.invite:" + JSON.stringify(device))
            try {
              return GroupService.invite(device).then(function (result) {
                console.log("GroupService.invite result: " + JSON.stringify(result))
              })
            }
            catch (err) {
              console.log("GroupService.invite error:" + err)
            }

          })
          .then(function (device) {
            // TODO: Change title, flickers too much on Chrome
            // $rootScope.pageTitle = device.name
            console.log("SettingsService.set")
            SettingsService.set('lastUsedDevice', serial)
          })
          .catch(function (err1) {
            console.log("error1:" + err1)
            console.log("redirect to / path!")
            $timeout(function () {
              $location.path('/')
            })
          })
      }).catch(function (err) {
        console.log("error:" + err)
        console.log("redirect2 to / path!")
        $timeout(function () {
          $location.path('/')
        })
      })
    }


    $scope.$watch('device.state', function (newValue, oldValue) {
      if (newValue !== oldValue) {
        if (oldValue === 'using') {
          console.log("device.state using:" + newValue)
          FatalMessageService.open($scope.device, false)
        }
      }
    }, true)
    console.log("get device:" + $routeParams.serial)
    return  getDevice($routeParams.serial)

  }
