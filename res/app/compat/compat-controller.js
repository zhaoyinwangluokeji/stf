var QueryParser = require('./util/query-parser')
//require('./datepicker-ui-bootstrap/Content/bootstrap.css')
//require('./datepicker-ui-bootstrap/Scripts/ui-bootstrap-tpls-1.3.2.js')
require('./datepicker-ui-bootstrap/Scripts/angular-locale_zh-cn.js')
//require('./datepicker-ui-bootstrap/Scripts/angular.js')

module.exports = function CompatCtrl(
  $scope
  , DeviceService
  , GroupService
  , ControlService
  , SettingsService
  , $location
) {
  console.log('DeviceListCtrl  ')
  $scope.tracker = DeviceService.trackAll($scope)
  $scope.control = ControlService.create($scope.tracker.devices, '*ALL')


  SettingsService.bind($scope, {
    target: 'sort'
    , source: 'deviceListSort'
  })

  $scope.filter = []

  $scope.activeCompatTabs = {
    commit: true,
    result: false
  }

  $scope.focusSearch =  function(){
    console.log("activieTabs: " + JSON.stringify($scope.activeCompatTabs))
  }

  SettingsService.bind($scope, {
    target: 'activeCompatTabs'
    , source: 'deviceListactiveCompatTabs'
  })

}
