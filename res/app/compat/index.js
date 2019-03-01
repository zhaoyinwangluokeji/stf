require('./compat.css')
require('nine-bootstrap')

module.exports = angular.module('compat', [
  require('angular-xeditable').name,
  require('stf/device').name,
  require('stf/user/group').name,
  require('stf/control').name,
  require('stf/common-ui').name,
  require('stf/settings').name,
  require('./empty').name,
  require('./icons').name,
  require('./report').name,
  require('./result').name,
  require('./customize').name,
  require('ui-bootstrap').name,
  require('./install/index').name,
  
])
  .config(['$routeProvider', function($routeProvider) {
    $routeProvider
      .when('/compat', {
        template: require('./compat.pug'),
        controller: 'CompatCtrl'
      })
  }])
  .run(function(editableOptions) {
    // bootstrap3 theme for xeditables
    editableOptions.theme = 'bs3'
  })
  .controller('CompatCtrl', require('./compat-controller'))
