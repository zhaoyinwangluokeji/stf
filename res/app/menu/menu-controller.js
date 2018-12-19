module.exports = function MenuCtrl($scope, $rootScope, SettingsService,
  $location, AppState) {

  SettingsService.bind($scope, {
    target: 'lastUsedDevice'
  })

  SettingsService.bind($rootScope, {
    target: 'platform',
    defaultValue: 'native'
  })
  $scope.user = AppState.user
  $rootScope.user = AppState.user
  $scope.$on('$routeChangeSuccess', function () {
    $scope.isControlRoute = $location.path().search('/control') !== -1
  })



  var MenusDefault = [
    {
      name: '设备租用日志统计'
      , selected: true
      , admin : false
//      , click: DeviceUsingStatistics
      , parameter:'Msg'
    },
    {
      name: '设备统计'
      , selected: true
      , admin : false
    }
  ]

 
  $scope.Menus = MenusDefault




}
