require('angular-route')
require('./dev-using-statistics.css')
require('nine-bootstrap')

module.exports = angular.module('stf.device-using-statistics', [
  require('stf/common-ui/modals/common').name,
  require('stf/socket').name,
  require('stf/app-state').name,
  require('stf/app-state').name,
  require('ui-bootstrap').name,
  'ngRoute',
  'ngTable'
])
  .factory('DevUsingStatisticsFactory', require('./dev-using-statistics'))
 