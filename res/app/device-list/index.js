require('./device-list.css')
require('nine-bootstrap')

module.exports = angular.module('device-list', [
  require('angular-xeditable').name,
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/control').name,
  require('stf/common-ui').name,
  require('stf/settings').name,
  require('./column').name,
  require('./columnlog').name,
  require('./details').name,
  require('./devicerentlog').name,
  require('./empty').name,
  require('./icons').name,
  require('./icons2').name,
  require('./stats').name,
  require('./customize').name,
  require('./search').name,
  require('ui-bootstrap').name,
  require('./devuslogstatistics').name
  
])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/devices', {
        template: require('./device-list.pug'),
        controller: 'DeviceListCtrl'
      })
  }])
  .run(function(editableOptions) {
    // bootstrap3 theme for xeditables
    editableOptions.theme = 'bs3'
  })
  .controller('DeviceListCtrl', require('./device-list-controller'))
