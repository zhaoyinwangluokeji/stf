module.exports = function MenuCtrl($scope, $rootScope,$http,$location, SettingsService, UsersService,
  $location, AppState) {

  SettingsService.bind($scope, {
    target: 'lastUsedDevice'
  })

  SettingsService.bind($rootScope, {
    target: 'platform',
    defaultValue: 'native'
  })
  $scope.user = AppState.user
  $scope.$on('$routeChangeSuccess', function () {
    $scope.isControlRoute = $location.path().search('/control') !== -1
  })

  $scope.ModifyPassword = function () {
    if (!AppState.user) {
      alert('没有选择用户')
    } else {
      var password = prompt("请输入新的密码", ""); //将输入的内容赋给变量 name ，   
      if (password) {
        return UsersService.ModifyPassword(AppState.user, password).then(function (data) {
          alert(data.msg)
        }).catch(function (err) {
          console.log("err:" + JSON.stringify(err))
        })
      }
    }
  }
  $scope.Logout = function () {
    return UsersService.Logout(AppState.user).then(function (data) {
      console.log("url:"+data.url)
      $location.path(data.url)
      $state.go(data.url)
    }).catch(function (err) {
      console.log("Logout err:" + JSON.stringify(err))
    })
  }
  

  var MenusDefault = [
    {
      name: '设备租用日志统计'
      , selected: true
      , admin: false
      //      , click: DeviceUsingStatistics
      , parameter: 'Msg'
    },
    {
      name: '设备统计'
      , selected: true
      , admin: false
    }
  ]
  $scope.Menus = MenusDefault

}
