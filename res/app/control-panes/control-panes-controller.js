module.exports =
  function ControlPanesController($scope, $http, gettext, $routeParams,
    $timeout, $location, DeviceService, GroupService, ControlService,
    StorageService, FatalMessageService, SettingsService,AppState) {



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
      DeviceService.get(serial, $scope)
        .then(function(device) {
          return GroupService.invite(device)
        })
        .then(function(device) {
          
          // TODO: Change title, flickers too much on Chrome
          // $rootScope.pageTitle = device.name

          SettingsService.set('lastUsedDevice', serial)
          if(device.device_rent_conf && 
            device.device_rent_conf.rent ){

            if( device.device_rent_conf.owner && 
              AppState.user.email == device.device_rent_conf.owner.email && 
              AppState.user.name == device.device_rent_conf.owner.name ){
                $scope.device = device
                $scope.control = ControlService.create(device, device.channel)
                return device
            }else{
              GroupService.kick(device,true)
              alert('设备已经被其他人申请使用，请租用其他设备')
              $location.path('/')
            }
            
        }
          else{
            GroupService.kick(device,true)
            alert('设备没有租用，请进入租用界面进行租用')
            $location.path('/')
          }
        })
        .catch(function() {
          $timeout(function() {
            $location.path('/')
          })
        })
    }

    getDevice($routeParams.serial)

    $scope.$watch('device.state', function(newValue, oldValue) {
      if (newValue !== oldValue) {
        if (oldValue === 'using') {
          FatalMessageService.open($scope.device, false)
        }
      }
    }, true)

  }
