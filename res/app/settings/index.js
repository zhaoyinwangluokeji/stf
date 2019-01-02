module.exports = angular.module('ui-settings', [
  require('./general').name,
  require('./keys').name,
  require('stf/common-ui/nice-tabs').name,
  require('./datasyn').name,
  require('./users').name,
  require('./devicegroups').name,
  require('./devicemanager').name,
  require('stf/app-state').name
])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/settings', {
      template: require('./settings.pug')
    })
  }])
  .controller('SettingsCtrl', require('./settings-controller'))
 